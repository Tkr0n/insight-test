variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "insight-test"
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