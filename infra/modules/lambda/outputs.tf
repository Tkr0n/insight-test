output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.markAsDone.arn
}

output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.markAsDone.function_name
}

output "security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}
