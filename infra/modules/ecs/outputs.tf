output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.frontend.name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.frontend.dns_name
}

output "alb_url" {
  description = "ALB URL"
  value       = "http://${aws_lb.frontend.dns_name}"
}
