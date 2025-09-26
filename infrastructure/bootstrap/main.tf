# =============================================================================
# TERRAFORM REMOTE STATE BOOTSTRAP
# =============================================================================
# This configuration creates the S3 bucket and DynamoDB table used for
# Terraform's remote state storage and locking.
#
# It should be run once manually before any other Terraform configurations.
# It uses a local state file because the remote backend doesn't exist yet.
# =============================================================================

terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.43.0"
    }
  }

  # This configuration uses local state because it is creating the remote state backend.
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region = "eu-west-2"
}

module "bootstrap" {
  source = "trussworks/bootstrap/aws"

  #Notes         #Input                           #Description                                                  Type    Default       Required
  region        = "eu-west-2"                     #AWS region. 	                                                string  n/a 	        yes
  account_alias = "td-management-account"         #The desired AWS account alias.                               string  n/a 	        yes
  # bucket_key_enabled = 	                        #Whether or not to use Amazon S3 Bucket Keys for SSE-KMS.
  # bucket_purpose =                              #Name to identify the bucket's purpose
  # dynamodb_point_in_time_recovery =	            #Point-in-time recovery options
  # dynamodb_table_name =                         #Name of the DynamoDB Table for locking Terraform state.
  # kms_master_key_id =	                          #The AWS KMS master key ID used for the SSE-KMS encryption of the state bucket.
  manage_account_alias = false                    #Manage the account alias as a resource. Set to 'false' if this behavior is not desired.
}