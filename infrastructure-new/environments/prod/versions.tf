terraform {
  # This backend block is a placeholder.
  # TODO: Update with your actual S3 bucket, key, and DynamoDB table for state locking.
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket-name"
  #   key            = "environments/dev/terraform.tfstate"
  #   region         = "eu-west-2"
  #   encrypt        = true
  #   dynamodb_table = "your-terraform-lock-table-name"
  # }

  required_version = ">= 1.5.0"

  # This module requires the AWS provider.
  # It accepts the default configuration and an optional aliased provider for replication.
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.us_east_1, aws.replica]
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2"
    }
  }
}