# OpenSearch Secret Rotation Handler

## Overview

This Lambda function implements AWS Secrets Manager rotation for OpenSearch master user credentials. It follows the standard AWS rotation template with four phases: createSecret, setSecret, testSecret, and finishSecret.

## Functionality

- **createSecret**: Generates a new complex password and stores it as AWSPENDING version
- **setSecret**: Updates the OpenSearch domain configuration with the new password
- **testSecret**: Validates the new credentials by connecting to OpenSearch
- **finishSecret**: Promotes the AWSPENDING version to AWSCURRENT

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENSEARCH_DOMAIN_NAME` | Name of the OpenSearch domain to update | Yes |
| `OPENSEARCH_ENDPOINT` | OpenSearch cluster endpoint URL | Yes |
| `AWS_REGION` | AWS region for the OpenSearch domain | Yes |

## IAM Permissions Required

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:DescribeSecret",
                "secretsmanager:GetSecretValue",
                "secretsmanager:PutSecretValue",
                "secretsmanager:UpdateSecretVersionStage"
            ],
            "Resource": "arn:aws:secretsmanager:*:*:secret:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "es:UpdateDomainConfig",
                "es:DescribeDomain"
            ],
            "Resource": "arn:aws:es:*:*:domain/*"
        }
    ]
}
```

## Secret Structure

The secret should contain the following JSON structure:

```json
{
    "opensearch_master_username": "master_user",
    "opensearch_master_password": "current_password",
    "opensearch_endpoint": "https://search-domain.region.es.amazonaws.com"
}
```

## Password Generation

- Minimum 24 characters
- Includes uppercase, lowercase, digits, and symbols
- Excludes problematic characters: `" / \ @ '`
- Uses cryptographically secure random generation

## Error Handling

- Structured logging with correlation IDs for distributed tracing
- PII scrubbing to prevent password exposure in logs
- Comprehensive error messages with context
- Proper exception propagation for Secrets Manager retry logic

## Testing

The function validates new credentials by:
1. Connecting to OpenSearch using basic authentication
2. Performing a simple cluster info query
3. Verifying the response contains expected cluster information

## Requirements Addressed

- **10.3**: Security and secrets management standardization
- **10.4**: Consistent secrets management and security practices  
- **5.3**: Production-ready logging and error handling integration

## Dependencies

- `boto3`: AWS SDK for Python
- `opensearch-py`: OpenSearch Python client
- `requests-aws4auth`: AWS authentication for requests