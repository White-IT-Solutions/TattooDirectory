# Provider configurations for the dev environment

# -----------------------------------------------------------------------------
# Management Account Provider (The "Hub")
# -----------------------------------------------------------------------------

# This is the primary provider where Terraform authenticates - this should correspond to the account where you run `terraform apply`.

provider "aws" {
  region = var.aws_region # Or a specific region for the management account

  default_tags {
    tags = local.common_tags
  }
}

# -----------------------------------------------------------------------------
# Child Account Providers (The "Spokes")
# -----------------------------------------------------------------------------

# --- INFRA Account Providers ---

# AWS provider for the Infra account (primary region)
provider "aws" {
  alias  = "infra_primary"
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.infra_account_id}:role/OrganizationAccountAccessRole"
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
    role_arn = "arn:aws:iam::${var.infra_account_id}:role/OrganizationAccountAccessRole"
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
    role_arn = "arn:aws:iam::${var.infra_account_id}:role/OrganizationAccountAccessRole"
  }

  default_tags {
    tags = local.common_tags
  }
}

# --- AUDIT Account Providers ---

# AWS provider for the Audit account (log archive, config history)
provider "aws" {
  alias  = "audit_primary"
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.audit_account_id}:role/OrganizationAccountAccessRole"
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
    role_arn = "arn:aws:iam::${var.audit_account_id}:role/OrganizationAccountAccessRole"
  }

  default_tags {
    tags = merge(local.common_tags, { "aws:cloudformation:stack-name" = "Audit-Resources" })
  }
}

# --- LOG ARCHIVE Account Providers ---

# AWS provider for the Log Archive account (primary region)
provider "aws" {
  alias  = "log_archive_primary"
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.log_archive_account_id}:role/OrganizationAccountAccessRole"
  }

  default_tags {
    tags = merge(local.common_tags, { "aws:cloudformation:stack-name" = "Log-Archive-Resources" })
  }
}

# AWS provider for Log Archive account replica region (cross-region replication)
provider "aws" {
  alias  = "log_archive_replica"
  region = var.replica_aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.log_archive_account_id}:role/OrganizationAccountAccessRole"
  }

  default_tags {
    tags = merge(local.common_tags, { "aws:cloudformation:stack-name" = "Log-Archive-Resources" })
  }
}
