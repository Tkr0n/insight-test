variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "S3 bucket domain name for frontend"
  type        = string
}

variable "api_gateway_domain" {
  description = "API Gateway domain for /api proxy"
  type        = string
}
