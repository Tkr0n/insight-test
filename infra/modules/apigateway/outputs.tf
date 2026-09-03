output "api_url" {
  description = "Public API URL"
  value       = "https://${var.api_domain}"
}

output "api_domain_name" {
  description = "Regional domain name for the Cloudflare CNAME target"
  value       = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].target_domain_name
}

output "api_execution_arn" {
  description = "API Gateway stage ARN (for WAF association)"
  value       = aws_apigatewayv2_stage.default.arn
}

output "api_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.main.id
}