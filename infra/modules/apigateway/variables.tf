variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "alb_dns_name" {
  description = "Public DNS name of the ALB (HTTP_PROXY integration target)"
  type        = string
}

variable "api_domain" {
  description = "Custom domain for the API Gateway (e.g. api.insight.verkku.com)"
  type        = string
}

variable "api_certificate_arn" {
  description = "ACM certificate ARN for the API custom domain (same region)"
  type        = string
}

variable "cors_origins" {
  description = "Allowed origins for CORS with credentials"
  type        = list(string)
}