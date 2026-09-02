data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-markAsDone-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Project = var.project_name
  }
}

resource "aws_iam_role_policy" "lambda_basic" {
  name = "${var.project_name}-lambda-basic"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
        ]
        Resource = "*"
      },
    ]
  })
}

resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for ${var.project_name} Lambda"
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project_name
  }
}

resource "null_resource" "lambda_package" {
  triggers = {
    requirements = filemd5("${path.module}/markAsDone/requirements.txt")
    handler      = filemd5("${path.module}/markAsDone/index.py")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/markAsDone && pip install -r requirements.txt -t . --quiet"
  }
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/markAsDone"
  output_path = "${path.module}/markAsDone.zip"
}

resource "aws_lambda_function" "markAsDone" {
  function_name = "${var.project_name}-markAsDone"
  role          = aws_iam_role.lambda.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      RDS_ENDPOINT    = var.rds_endpoint
      RDS_PORT        = tostring(var.rds_port)
      RDS_DB_NAME     = var.rds_db_name
      RDS_DB_USER     = var.rds_db_user
      RDS_DB_PASSWORD = var.rds_db_password
      REDIS_ENDPOINT  = var.redis_endpoint
      REDIS_PORT      = tostring(var.redis_port)
      COGNITO_POOL_ID = var.cognito_pool_id
    }
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.markAsDone.function_name}"
  retention_in_days = 14

  tags = {
    Project = var.project_name
  }
}
