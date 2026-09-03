output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend.name
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend.name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "ALB URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "task_role_arn" {
  description = "ECS task role ARN (runtime AWS API calls)"
  value       = aws_iam_role.task.arn
}

output "task_role_name" {
  description = "ECS task role name"
  value       = aws_iam_role.task.name
}

output "https_listener_arn" {
  description = "ALB HTTPS listener ARN (API Gateway integration target)"
  value       = aws_lb_listener.https.arn
}

output "http_listener_arn" {
  description = "ALB HTTP listener ARN (API Gateway integration target)"
  value       = aws_lb_listener.http.arn
}

output "alb_arn" {
  description = "ALB ARN (WAF association target)"
  value       = aws_lb.main.arn
}
