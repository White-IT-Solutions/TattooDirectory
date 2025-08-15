# Provider for us-east-1 region (required for CloudFront ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Provider for replica region.
provider "aws" {
  alias  = "replica"
  region = var.replica_aws_region
}

# Default AWS provider for the primary region.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project            = var.project_name
      Environment        = var.environment
      ManagedBy          = var.managed_by
      Owner              = var.owner_email
      Version            = var.app_version
      DataClassification = var.default_data_classification
    }
  }
}