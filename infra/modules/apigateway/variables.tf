variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "alb_listener_arn" {
  description = "ARN of the ALB HTTPS listener that fronts the backend ECS service"
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

variable "internal_api_host" {
  description = "Host header value the gateway sends to the ALB (matches the host-header listener rule)"
  type        = string
}