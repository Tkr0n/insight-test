terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

module "cognito" {
  source = "./modules/cognito"

  project_name = var.project_name
  aws_region   = var.aws_region
}

module "rds" {
  source = "./modules/rds"

  project_name = var.project_name
  db_name      = var.db_name
  db_user      = var.db_user
  db_password  = var.db_password
}

module "elasticache" {
  source = "./modules/elasticache"

  project_name = var.project_name
}

module "lambda" {
  source = "./modules/lambda"

  project_name    = var.project_name
  rds_endpoint    = module.rds.endpoint
  rds_port        = module.rds.port
  rds_db_name     = var.db_name
  rds_db_user     = var.db_user
  rds_db_password = var.db_password
  redis_endpoint  = module.elasticache.endpoint
  redis_port      = module.elasticache.port
  cognito_pool_id = module.cognito.user_pool_id
}

module "apigateway" {
  source = "./modules/apigateway"

  project_name        = var.project_name
  alb_listener_arn    = module.ecs.http_listener_arn
  api_domain          = "api.${var.domain_name}"
  api_certificate_arn = aws_acm_certificate.api.arn
  cors_origins        = ["https://${var.domain_name}"]
  internal_api_host   = "api.${var.domain_name}"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Project = var.project_name
  }
}

resource "aws_acm_certificate" "api" {
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  tags = {
    Project = var.project_name
  }
}

module "ecs" {
  source = "./modules/ecs"

  project_name    = var.project_name
  vpc_id          = data.aws_vpc.default.id
  subnet_ids      = data.aws_subnets.default.ids
  
  frontend_image = "ghcr.io/tkr0n/insight-test/insightt-frontend:latest"
  frontend_port  = 80
  
  backend_image = "ghcr.io/tkr0n/insight-test/insightt-backend:latest"
  backend_port  = 3000
  
  certificate_arn = aws_acm_certificate.main.arn

  additional_certificate_arn = aws_acm_certificate.api.arn
  internal_api_host          = "api.${var.domain_name}"

  backend_env = {
    DATABASE_URL           = "postgresql://${var.db_user}:${var.db_password}@${module.rds.hostname}:${module.rds.port}/${var.db_name}"
    REDIS_URL              = "redis://${module.elasticache.endpoint}:${module.elasticache.port}"
    AWS_REGION             = var.aws_region
    LAMBDA_FUNCTION_NAME   = "${var.project_name}-markAsDone"
    COGNITO_USER_POOL_ID   = module.cognito.user_pool_id
    COGNITO_CLIENT_ID      = module.cognito.client_id
    NODE_ENV               = "production"
    PORT                   = "3000"
    CORS_ORIGIN            = "https://${var.domain_name}"
    CSRF_SECRET            = var.csrf_secret
    COOKIE_SECURE          = "true"
    COOKIE_DOMAIN          = ".${var.domain_name}"
    ADMIN_EMAIL            = "admin@insightt.com"
  }
}

resource "aws_iam_role_policy" "backend_lambda_invoke" {
  name   = "${var.project_name}-backend-invoke-lambda"
  role   = module.ecs.task_role_name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = module.lambda.function_arn
      },
    ]
  })
}

resource "aws_iam_role_policy" "backend_cognito_admin" {
  name   = "${var.project_name}-backend-cognito-admin"
  role   = module.ecs.task_role_name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminConfirmSignUp",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminDeleteUser",
        ]
        Resource = module.cognito.user_pool_arn
      },
    ]
  })
}

resource "aws_wafv2_web_acl" "api" {
  name        = "${var.project_name}-api-waf"
  description = "Rate limiting for the Insightt API Gateway"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            field_to_match {
              uri_path {}
            }
            positional_constraint = "STARTS_WITH"
            search_string         = "/api"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-api-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-api-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_wafv2_web_acl_association" "api" {
  resource_arn = module.apigateway.api_execution_arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}
