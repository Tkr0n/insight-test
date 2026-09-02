output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.port
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.endpoint
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = module.elasticache.port
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.lambda.function_arn
}

output "api_url" {
  description = "API Gateway invoke URL"
  value       = module.apigateway.api_url
}

output "frontend_bucket" {
  description = "S3 bucket for frontend"
  value       = module.s3.bucket_id
}

output "frontend_url" {
  description = "Frontend S3 website URL"
  value       = "http://${module.s3.website_endpoint}"
}
