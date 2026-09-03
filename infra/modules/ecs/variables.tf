variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ALB"
  type        = list(string)
}

# Frontend
variable "frontend_image" {
  description = "Docker image for frontend"
  type        = string
}

variable "frontend_port" {
  description = "Port exposed by frontend container"
  type        = number
  default     = 80
}

# Backend
variable "backend_image" {
  description = "Docker image for backend"
  type        = string
}

variable "backend_port" {
  description = "Port exposed by backend container"
  type        = number
  default     = 3000
}

variable "backend_env" {
  description = "Environment variables for backend"
  type        = map(string)
  default     = {}
}

# Shared
variable "task_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of tasks"
  type        = number
  default     = 1
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener"
  type        = string
}

variable "additional_certificate_arn" {
  description = "ACM certificate ARN for api.<domain> (SNI on the HTTPS listener)"
  type        = string
}

variable "backend_min_capacity" {
  description = "Minimum backend ECS tasks"
  type        = number
  default     = 1
}

variable "backend_max_capacity" {
  description = "Maximum backend ECS tasks"
  type        = number
  default     = 4
}

variable "backend_cpu_target" {
  description = "Target average CPU utilization % for backend auto-scaling"
  type        = number
  default     = 70
}
