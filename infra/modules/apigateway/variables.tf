variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Lambda function invoke ARN"
  type        = string
}

variable "cognito_pool_arn" {
  description = "Cognito User Pool ARN for authorization"
  type        = string
}
