#!/bin/bash

# Insightt - AWS LocalStack Initialization Script
# This script runs automatically when LocalStack is ready.
set -e

echo "========================================="
echo "  Insightt - Initializing AWS Services  "
echo "========================================="

# -----------------------------------------------
# 1. Create Cognito User Pool
# -----------------------------------------------
echo "[1/2] Creating Cognito User Pool..."

USER_POOL_ID=$(awslocal cognito-idp create-user-pool \
  --pool-name "insightt-user-pool" \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --query 'UserPool.Id' \
  --output text)

echo "    User Pool ID: $USER_POOL_ID"

# -----------------------------------------------
# 2. Create App Client (SPA - no client secret)
# -----------------------------------------------
echo "[2/2] Creating Cognito App Client..."

APP_CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name "insightt-spa-client" \
  --generate-secret=false \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --prevent-user-existence-enabled \
  --supported-identity-providers COGNITO \
  --callback-urls "http://localhost:5173" \
  --logout-urls "http://localhost:5173" \
  --token-validity-units '{
    "AccessToken": "hours",
    "IdToken": "hours",
    "RefreshToken": "hours"
  }' \
  --access-token-validity 1 \
  --id-token-validity 1 \
  --refresh-token-validity 24 \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "    App Client ID: $APP_CLIENT_ID"

# -----------------------------------------------
# 3. Create Test Users
# -----------------------------------------------
echo "[3/3] Creating test users..."

create_test_user() {
  local email=$1
  local password=$2
  local name=$3
  
  echo "    Creating user: $email"
  
  # Sign up the user
  awslocal cognito-idp sign-up \
    --client-id "$APP_CLIENT_ID" \
    --username "$email" \
    --password "$password" \
    --user-attributes Name=email,Value="$email" Name=name,Value="$name" \
    > /dev/null
  
  # Auto-confirm the user (skip email verification)
  awslocal cognito-idp admin-confirm-sign-up \
    --user-pool-id "$USER_POOL_ID" \
    --username "$email" \
    > /dev/null
  
  echo "      ✓ Created and confirmed: $email"
}

# Test user 1
create_test_user "test@insightt.com" "TestPass123" "Test User"

# Test user 2
create_test_user "admin@insightt.com" "AdminPass123" "Admin User"

# -----------------------------------------------
# Summary
# -----------------------------------------------
echo ""
echo "========================================="
echo "  Setup Complete"
echo "========================================="
echo "  User Pool ID:    $USER_POOL_ID"
echo "  App Client ID:   $APP_CLIENT_ID"
echo "  Region:          us-east-1"
echo ""
echo "  Test Users Created:"
echo "  ────────────────────────────────────────"
echo "  Email:           test@insightt.com"
echo "  Password:        TestPass123"
echo "  ────────────────────────────────────────"
echo "  Email:           admin@insightt.com"
echo "  Password:        AdminPass123"
echo "========================================="

# -----------------------------------------------
# TODO: Deploy markAsDone Lambda
# -----------------------------------------------
# In the future, package and deploy the AWS Lambda function
# for the /tasks/{id}/done endpoint:
#
# 1. Zip the Lambda code:
#    cd /lambda/markAsDone && zip -r /tmp/markAsDone.zip .
#
# 2. Create the Lambda function:
#    awslocal lambda create-function \
#      --function-name markAsDone \
#      --runtime python3.12 \
#      --handler lambda_handler.handler \
#      --zip-file fileb:///tmp/markAsDone.zip \
#      --role arn:aws:iam::000000000000:role/lambda-role
#
# 3. Set environment variables (DB credentials, Redis endpoint)
#
# 4. Create API Gateway integration
