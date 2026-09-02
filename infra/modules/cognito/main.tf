resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-users"

  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_cognito_user_pool_client" "spa" {
  name         = "${var.project_name}-spa-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"

  supported_identity_providers = ["COGNITO"]

  callback_urls = ["http://localhost:5173"]
  logout_urls   = ["http://localhost:5173"]

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "hours"
  }

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 24
}

resource "null_resource" "test_users" {
  for_each = toset(["test@insightt.com", "admin@insightt.com"])

  triggers = {
    user_pool_id = aws_cognito_user_pool.main.id
    app_client_id = aws_cognito_user_pool_client.spa.id
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command = <<-EOT
      set -e

      # Sign up (ignore error if user already exists)
      aws cognito-idp sign-up \
        --client-id "${aws_cognito_user_pool_client.spa.id}" \
        --username "${each.key}" \
        --password "TestPass123" \
        --user-attributes "Name=email,Value=${each.key}" "Name=name,Value=Test User" \
        --region "${var.aws_region}" || true

      # Auto-confirm (ignore error if already confirmed)
      aws cognito-idp admin-confirm-sign-up \
        --user-pool-id "${aws_cognito_user_pool.main.id}" \
        --username "${each.key}" \
        --region "${var.aws_region}" || true

      echo "User ${each.key} created/confirmed"
    EOT
  }

  depends_on = [
    aws_cognito_user_pool.main,
    aws_cognito_user_pool_client.spa,
  ]
}
