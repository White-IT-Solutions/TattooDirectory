# Terraform Remote State Bootstrap

This directory contains the Terraform configuration to create the necessary AWS resources for managing Terraform's remote state.

## Purpose

It uses the `trussworks/bootstrap/aws` module to create:
1.  An **S3 Bucket** to store the `terraform.tfstate` files.
2.  A **DynamoDB Table** to handle state locking and prevent concurrent runs from corrupting the state.

## Usage

This configuration should be run **once** before any other Terraform infrastructure is deployed. It uses a local backend because the remote state resources do not yet exist.

1.  Navigate to this directory: `cd infrastructure/bootstrap`
2.  Initialize Terraform: `terraform init`
3.  Apply the configuration: `terraform apply`

After this is successfully applied, the S3 bucket and DynamoDB table will be ready for use by the `dev` and `prod` environment configurations.