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
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --prevent-user-existence-enabled \
  --supported-identity-providers COGNITO \
  --callback-urls "http://localhost:5173" \
  --logout-urls "http://localhost:5173" \
  --token-validity-units '{
    "AccessToken": "hours",
    "IdToken": "hours",
    "RefreshToken": "days"
  }' \
  --access-token-validity 1 \
  --id-token-validity 1 \
  --refresh-token-validity 30 \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "    App Client ID: $APP_CLIENT_ID"

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
