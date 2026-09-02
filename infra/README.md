# Infrastructure

Terraform IaC modules for deploying Insightt to AWS production.

## Architecture

```
infra/
├── main.tf                    # Root config, provider, module wiring
├── variables.tf               # Root variables
├── outputs.tf                 # Root outputs (fed to Coolify)
├── terraform.tfvars.example   # Example variable values
└── modules/
    ├── cognito/               # User Pool + SPA Client
    ├── rds/                   # PostgreSQL 16 on db.t3.micro
    ├── elasticache/           # Redis 7 on cache.t3.micro
    └── lambda/                # markAsDone function (Python 3.12)
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with credentials
- Python 3.12 (for Lambda dependency packaging)

## Deploy

```bash
cd infra

# Initialize (downloads providers)
terraform init

# Preview changes
terraform plan -var-file="terraform.tfvars"

# Apply infrastructure
terraform apply -var-file="terraform.tfvars"
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `project_name` | Resource naming prefix | `insightt` |
| `db_password` | PostgreSQL password (sensitive) | Required |
| `db_name` | Database name | `insightt_db` |
| `db_user` | Database user | `insightt_user` |

Create `terraform.tfvars` from the example:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values
```

## Outputs

After apply, Terraform outputs values needed for Coolify environment variables:

| Output | Description | Coolify Env Var |
|--------|-------------|-----------------|
| `cognito_user_pool_id` | Cognito User Pool ID | `COGNITO_USER_POOL_ID` |
| `cognito_client_id` | Cognito App Client ID | `COGNITO_CLIENT_ID` |
| `rds_endpoint` | RDS hostname | Part of `DATABASE_URL` |
| `rds_port` | RDS port | Part of `DATABASE_URL` |
| `redis_endpoint` | Redis hostname | Part of `REDIS_URL` |
| `redis_port` | Redis port | Part of `REDIS_URL` |
| `lambda_function_arn` | Lambda function ARN | `MARK_AS_DONE_LAMBDA_ARN` |

### DATABASE_URL format

```
postgresql://<db_user>:<db_password>@<rds_endpoint>:<rds_port>/<db_name>
```

### REDIS_URL format

```
redis://<redis_endpoint>:<redis_port>
```

## Teardown

```bash
terraform destroy -var-file="terraform.tfvars"
```

## Module Details

### Cognito

- User Pool with email-based authentication
- SPA client configured for SRP auth flow
- 1-hour access/ID tokens, 24-hour refresh tokens

### RDS

- PostgreSQL 16 on `db.t3.micro`
- 20GB GP3 storage (auto-scales to 100GB)
- Encrypted at rest, 7-day backup retention
- Deployed in default VPC subnets

### ElastiCache

- Redis 7.1 on `cache.t3.micro`
- Single node, default.redis7 parameter group
- Deployed in default VPC subnets

### Lambda

- Python 3.12 runtime, 256MB memory, 30s timeout
- `markAsDone` handler with idempotency via Redis SETNX
- Pessimistic locking via `SELECT ... FOR UPDATE`
- VPC-enabled for RDS/Redis access
- CloudWatch logs with 14-day retention
