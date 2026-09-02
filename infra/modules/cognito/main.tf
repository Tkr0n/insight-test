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
