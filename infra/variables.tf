variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "insight-test-tkr0n"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "insight_test_db"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "insight_test_user"
}

variable "csrf_secret" {
  description = "HMAC secret for Double Submit CSRF (min 32 chars)"
  type        = string
  sensitive   = true
}

variable "cors_origin" {
  description = "Allowed CORS origin for backend (must be exact when using cookies, not *)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for ACM certificate and CORS"
  type        = string
  default     = "insight.verkku.com"
}