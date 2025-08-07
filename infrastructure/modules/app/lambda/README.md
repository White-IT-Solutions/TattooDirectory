# OpenSearch Secrets Manager Rotation Lambda

This directory contains the Lambda function code for automatically rotating OpenSearch master user passwords using AWS Secrets Manager.

## Files

- `secret_rotation.py` - Main Lambda function code for password rotation
- `requirements.txt` - Python dependencies (boto3 is included in Lambda runtime)
- `README.md` - This documentation file

## Function Overview

The rotation function implements the standard AWS Secrets Manager rotation pattern with four steps:

1. **createSecret** - Generate a new password and store it as AWSPENDING
2. **setSecret** - Update the OpenSearch domain with the new password
3. **testSecret** - Validate the new credentials work correctly
4. **finishSecret** - Mark the new version as AWSCURRENT

## Environment Variables

The Lambda function expects the following environment variables:

- `OPENSEARCH_DOMAIN_NAME` - Name of the OpenSearch domain to update

## Security Features

- **Complex Password Generation** - 24-character passwords with mixed case, numbers, and symbols
- **Character Exclusion** - Excludes problematic characters that could cause issues
- **Comprehensive Logging** - Detailed logging for troubleshooting and audit trails
- **Error Handling** - Proper exception handling with meaningful error messages
- **Type Hints** - Full type annotations for better code quality

## Password Requirements

Generated passwords meet the following criteria:
- Minimum 24 characters
- Contains uppercase letters
- Contains lowercase letters  
- Contains numbers
- Contains special characters
- Excludes problematic characters: `"@/\`'`

## Customization

To customize the rotation logic:

1. Modify `secret_rotation.py` directly
2. Update password complexity requirements in `generate_complex_password()`
3. Implement actual connection testing in `test_secret()`
4. Add additional validation logic as needed

## Testing

The function can be tested locally by:

1. Setting up AWS credentials
2. Creating a test event with the required structure
3. Running the function with appropriate environment variables

## Deployment

The function is automatically deployed via Terraform when the infrastructure is applied. The code is packaged into a ZIP file and uploaded to AWS Lambda.

## Monitoring

The function logs to CloudWatch Logs with the log group:
`/aws/lambda/{project-name}-{environment}-secret-rotation`

X-Ray tracing is enabled for performance monitoring and debugging.