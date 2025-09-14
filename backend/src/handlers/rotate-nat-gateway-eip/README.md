# NAT Gateway EIP Rotation Handler

## Overview

This Lambda function rotates the Elastic IP (EIP) associated with a NAT Gateway to enhance security by changing the outbound IP address used for scraping operations. The rotation process maintains the old EIP for rollback capability.

## Functionality

- Finds NAT Gateway by tag name pattern
- Allocates a new Elastic IP address
- Associates the new EIP with the NAT Gateway
- Disassociates the old EIP (but does NOT release it for rollback)
- Sends SNS notifications for success/failure
- Implements structured logging with PII scrubbing

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NAT_GATEWAY_TAG_VALUE` | Tag value prefix to identify the NAT Gateway | Yes |
| `SNS_TOPIC_ARN` | SNS topic ARN for notifications | Yes |

## IAM Permissions Required

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeNatGateways",
                "ec2:AllocateAddress",
                "ec2:AssociateAddress",
                "ec2:DescribeAddresses"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish"
            ],
            "Resource": "arn:aws:sns:*:*:*"
        }
    ]
}
```

## Usage

This function is typically invoked on a schedule (e.g., weekly) to rotate NAT Gateway IPs for security purposes. It can also be triggered manually for immediate rotation.

## Error Handling

- Comprehensive error logging with correlation IDs
- SNS notifications for both success and failure scenarios
- Structured error responses with timestamps
- Sensitive data scrubbing in logs

## Rollback Process

The old EIP is intentionally NOT released to allow for manual rollback if needed. A separate process should clean up old EIPs after a suitable retention period (e.g., 24-48 hours).

## Requirements Addressed

- **10.3**: Security and secrets management standardization
- **10.4**: Consistent secrets management and security practices
- **5.3**: Production-ready logging and error handling integration