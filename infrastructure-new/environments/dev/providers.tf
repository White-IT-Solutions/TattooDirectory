# Provider configurations for the dev environment

# Default AWS provider (primary region)
provider "aws" {
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.infra_account_id}:role/AWSControlTowerExecution"
  }

  default_tags {
    tags = local.common_tags
  }
}

# AWS provider for US East 1 (required for CloudFront certificates)
provider "aws" {
  alias  = "infra_us_east_1"
  region = "us-east-1"

  assume_role {
    role_arn = "arn:aws:iam::${var.infra_account_id}:role/AWSControlTowerExecution"
  }

  default_tags {
    tags = local.common_tags
  }
}

# AWS provider for replica region (cross-region replication)
provider "aws" {
  alias  = "infra_replica"
  region = var.replica_aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.infra_account_id}:role/AWSControlTowerExecution"
  }

  default_tags {
    tags = local.common_tags
  }
}

# AWS provider for the Security account (logging, audit, etc.)
provider "aws" {
  alias  = "security_primary"
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.security_account_id}:role/AWSControlTowerExecution"
  }

  default_tags {
    tags = merge(local.common_tags, { "aws:cloudformation:stack-name" = "Security-Resources" })
  }
}

# AWS provider for Security account replica region (cross-region replication)
provider "aws" {
  alias  = "security_replica"
  region = var.replica_aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.security_account_id}:role/AWSControlTowerExecution"
  }

  default_tags {
    tags = merge(local.common_tags, { "aws:cloudformation:stack-name" = "Security-Resources" })
  }
}

# AWS provider for the Audit account (log archive, config history)
provider "aws" {
  alias  = "audit_primary"
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.audit_account_id}:role/AWSControlTowerExecution"
  }

  default_tags {
    tags = merge(local.common_tags, { "aws:cloudformation:stack-name" = "Audit-Resources" })
  }
}

# AWS provider for Audit account replica region (cross-region replication)
provider "aws" {
  alias  = "audit_replica"
  region = var.replica_aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.audit_account_id}:role/AWSControlTowerExecution"
  }

  default_tags {
    tags = merge(local.common_tags, { "aws:cloudformation:stack-name" = "Audit-Resources" })
  }
}
