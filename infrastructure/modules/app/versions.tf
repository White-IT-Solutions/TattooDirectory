terraform {
  required_version = ">= 1.5"
}

# Configure the AWS Provider with default tags
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}