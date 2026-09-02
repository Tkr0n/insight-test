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

resource "aws_lambda_permission" "apigateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.apigateway.execution_arn}/*/*"
}

module "apigateway" {
  source = "./modules/apigateway"

  project_name      = var.project_name
  lambda_invoke_arn = module.lambda.invoke_arn
  cognito_pool_arn  = module.cognito.user_pool_arn
}

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
}
