terraform {
  # This backend block configures Terraform to store its state file remotely in S3.
  # This is a critical best practice for collaboration and state integrity.
  # The S3 bucket and DynamoDB table were created by the 'bootstrap' configuration.
  backend "s3" {
    bucket         = "td-management-account-tf-state-eu-west-2"
    key            = "environments/dev/terraform.tfstate"
    region         = "eu-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }

  required_version = ">= 1.5.0"

  # This module requires the AWS provider.
  # It accepts the default configuration and an optional aliased provider for replication.
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.infra_us_east_1, aws.infra_replica, aws.audit_primary, aws.audit_replica, aws.log_archive_primary, aws.log_archive_replica]
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