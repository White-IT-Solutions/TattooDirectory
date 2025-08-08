terraform {
  required_version = ">= 1.5.0"

  # This module requires the AWS provider.
  # It accepts the default configuration and an optional aliased provider for replication.
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.replica, aws.us_east_1]
    }
  }
}