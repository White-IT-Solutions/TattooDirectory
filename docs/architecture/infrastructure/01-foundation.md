# Foundation Module (01-foundation)

## Overview
The Foundation module provides the core foundational resources that other modules depend on. It establishes the basic infrastructure components including encryption keys, random values, and code signing configurations.

## Purpose
- Provides foundational AWS resources for the entire infrastructure
- Establishes encryption standards with KMS keys
- Generates secure random values for passwords and unique identifiers
- Sets up code signing for Lambda functions in production environments

## Resources Created

### Data Sources
- **aws_caller_identity.current**: Gets current AWS account information
- **aws_region.current**: Gets current AWS region information  
- **aws_availability_zones.available**: Lists available availability zones

### Random Resources
- **random_id.suffix**: 4-byte random suffix for unique resource naming
- **random_password.opensearch_master**: 16-character password for OpenSearch master user
- **random_password.app_secrets**: 32-character password for application secrets

### KMS Keys
- **aws_kms_key.main**: Primary KMS key for general encryption across the infrastructure
- **aws_kms_alias.main**: Alias for the main KMS key (`alias/{name_prefix}-main`)
- **aws_kms_key.replica** (conditional): Cross-region replica KMS key for production environments
- **aws_kms_alias.replica** (conditional): Alias for the replica KMS key

### Code Signing (Production Only)
- **aws_signer_signing_profile.lambda**: Lambda function signing profile for production
- **aws_lambda_code_signing_config.main**: Code signing configuration for Lambda functions

## Key Features

### Security
- All KMS keys have key rotation enabled
- Cross-account access policies for S3 replication
- Code signing enforced in production environments
- Separate deletion windows (30 days prod, 7 days dev)

### Cross-Region Support
- Conditional replica KMS key creation based on `enable_cross_region_replication`
- Replica resources use the `aws.replica` provider

### Environment-Specific Behavior
- Production: 30-day KMS key deletion window, code signing enabled
- Development: 7-day KMS key deletion window, no code signing

## Dependencies
- None (this is a foundational module)

## Outputs
- Account ID and region information
- Random values for resource naming and passwords
- KMS key IDs and ARNs for use by other modules
- Code signing configuration ARNs for Lambda functions

## Integration with Other Modules
- **All Modules**: Use the main KMS key for encryption
- **App Storage**: Uses random suffix for unique bucket naming
- **Search**: Uses OpenSearch master password
- **App Security**: Uses app secrets password
- **Compute**: Uses code signing configuration in production
- **Log Storage**: Uses replica KMS key for cross-region replication

## Security Considerations
- KMS keys support cross-account access for centralized logging
- Random passwords are marked as sensitive outputs
- Code signing provides additional security for Lambda functions in production
- Key policies follow least-privilege principles

## Cost Implications
- KMS keys incur monthly charges (~$1/month per key)
- Cross-region replica keys double KMS costs in production
- Code signing has minimal additional costs