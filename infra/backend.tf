terraform {
  backend "s3" {
    bucket         = "insight-test-tfstate"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "insight-test-tflock"
  }
}
