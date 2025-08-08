terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

# Provider for us-east-1 region (required for CloudFront ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Provider for replica region, used for cross-region S3 replication in production.
# Consider using a variable for the region for better configuration management.
provider "aws" {
  alias  = "replica"
  region = var.replica_aws_region
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project             = var.project_name
      Environment         = var.environment
      ManagedBy           = "terraform"
      Owner               = var.owner_email
      Version             = var.app_version
      DataClassification  = var.default_data_classification
    }
  }
}