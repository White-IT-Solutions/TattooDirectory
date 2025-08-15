# Provider configurations for the dev environment

# Default AWS provider (primary region)
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# AWS provider for US East 1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

# AWS provider for replica region (cross-region replication)
provider "aws" {
  alias  = "replica"
  region = var.replica_aws_region

  default_tags {
    tags = local.common_tags
  }
}
