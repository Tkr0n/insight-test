variable "project_name" {
  description = "Project name"
  type        = string
}

variable "rds_endpoint" {
  description = "RDS endpoint"
  type        = string
}

variable "rds_port" {
  description = "RDS port"
  type        = number
}

variable "rds_db_name" {
  description = "RDS database name"
  type        = string
}

variable "rds_db_user" {
  description = "RDS database user"
  type        = string
}

variable "rds_db_password" {
  description = "RDS database password"
  type        = string
  sensitive   = true
}

variable "redis_endpoint" {
  description = "Redis endpoint"
  type        = string
}

variable "redis_port" {
  description = "Redis port"
  type        = number
}

variable "cognito_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}
