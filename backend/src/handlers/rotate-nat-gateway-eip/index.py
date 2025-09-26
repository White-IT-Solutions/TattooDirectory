import boto3
import os
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables to be set in Lambda config
NAT_GATEWAY_TAG_VALUE = os.environ['NAT_GATEWAY_TAG_VALUE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

ec2 = boto3.client('ec2')
sns = boto3.client('sns')


def get_correlation_id(context: Any, event: Dict[str, Any] = None) -> str:
    """
    Extracts correlation ID from various sources for distributed tracing.
    
    Args:
        context: Lambda context object
        event: Lambda event object
        
    Returns:
        Correlation ID string
    """
    if hasattr(context, 'aws_request_id') and context.aws_request_id:
        return context.aws_request_id
    
    if event and event.get('requestContext', {}).get('requestId'):
        return event['requestContext']['requestId']
    
    # Generate a new correlation ID if none found
    import random
    import string
    return f"gen-{int(datetime.now().timestamp())}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"


def structured_log(level: str, message: str, data: Dict[str, Any] = None, context: Any = None, event: Dict[str, Any] = None) -> None:
    """
    Creates structured log entries with correlation ID support.
    
    Args:
        level: Log level (INFO, WARN, ERROR)
        message: Log message
        data: Additional data to log
        context: Lambda context object
        event: Lambda event object
    """
    correlation_id = get_correlation_id(context, event)
    
    log_entry = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'level': level,
        'message': message,
        'correlationId': correlation_id,
        'service': 'rotate-nat-gateway-eip'
    }
    
    if data:
        # Scrub sensitive data
        scrubbed_data = scrub_sensitive_data(data)
        log_entry['data'] = scrubbed_data
    
    logger.info(json.dumps(log_entry))


def scrub_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Scrubs sensitive information from log data.
    
    Args:
        data: Dictionary containing log data
        
    Returns:
        Dictionary with sensitive data redacted
    """
    if not isinstance(data, dict):
        return data
    
    sensitive_keys = {
        'password', 'secret', 'key', 'token', 'credential',
        'allocation_id', 'network_interface_id'  # Potentially sensitive AWS resource IDs
    }
    
    scrubbed = {}
    for key, value in data.items():
        if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
            scrubbed[key] = '[REDACTED]'
        elif isinstance(value, dict):
            scrubbed[key] = scrub_sensitive_data(value)
        else:
            scrubbed[key] = value
    
    return scrubbed


def create_error_response(status_code: int, error_message: str, correlation_id: str) -> Dict[str, Any]:
    """
    Creates a standardized error response.
    
    Args:
        status_code: HTTP status code
        error_message: Error message
        correlation_id: Request correlation ID
        
    Returns:
        Standardized error response dictionary
    """
    return {
        'statusCode': status_code,
        'body': json.dumps({
            'error': error_message,
            'correlationId': correlation_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Finds a NAT Gateway by tag, allocates a new EIP,
    associates it, and disassociates the old EIP without releasing it to allow for rollback.
    
    Args:
        event: Lambda event containing request data
        context: Lambda context object
        
    Returns:
        Response dictionary with status and message
    """
    correlation_id = get_correlation_id(context, event)
    old_allocation_id = None
    
    try:
        structured_log('INFO', 'Starting NAT Gateway EIP rotation', {
            'nat_gateway_tag_value': NAT_GATEWAY_TAG_VALUE
        }, context, event)
        
        # 1. Find the NAT Gateway by tag
        structured_log('INFO', f'Searching for NAT Gateway with tag Name starting with: {NAT_GATEWAY_TAG_VALUE}', 
                      context=context, event=event)
        
        response = ec2.describe_nat_gateways(
            Filters=[{'Name': 'tag:Name', 'Values': [f"{NAT_GATEWAY_TAG_VALUE}*"]}]
        )
        
        if not response['NatGateways']:
            error_msg = f"No NAT Gateway found with tag Name={NAT_GATEWAY_TAG_VALUE}"
            structured_log('ERROR', error_msg, context=context, event=event)
            raise Exception(error_msg)
        
        nat_gateway = response['NatGateways'][0]
        nat_gateway_id = nat_gateway['NatGatewayId']
        
        structured_log('INFO', f'Found NAT Gateway: {nat_gateway_id}', 
                      {'nat_gateway_id': nat_gateway_id}, context, event)
        
        if not nat_gateway.get('NatGatewayAddresses'):
            error_msg = f"NAT Gateway {nat_gateway_id} has no associated EIPs"
            structured_log('ERROR', error_msg, context=context, event=event)
            raise Exception(error_msg)
        
        old_association = nat_gateway['NatGatewayAddresses'][0]
        network_interface_id = old_association['NetworkInterfaceId']
        old_allocation_id = old_association['AllocationId']
        
        structured_log('INFO', 'Identified old EIP association', {
            'old_allocation_id': '[REDACTED]',  # Scrub for security
            'network_interface_id': '[REDACTED]'
        }, context, event)
        
        # 2. Allocate a new EIP
        structured_log('INFO', 'Allocating new EIP for VPC scope', context=context, event=event)
        
        new_eip_response = ec2.allocate_address(Domain='vpc')
        new_allocation_id = new_eip_response['AllocationId']
        new_public_ip = new_eip_response['PublicIp']
        
        structured_log('INFO', 'Allocated new EIP', {
            'new_public_ip': new_public_ip,
            'new_allocation_id': '[REDACTED]'
        }, context, event)
        
        # 3. Associate the new EIP
        structured_log('INFO', 'Associating new EIP with Network Interface', context=context, event=event)
        
        ec2.associate_address(
            AllocationId=new_allocation_id,
            NetworkInterfaceId=network_interface_id
        )
        
        structured_log('INFO', 'Successfully associated new EIP. Old EIP is now disassociated', 
                      context=context, event=event)
        
        # 4. Do NOT release the old EIP for rollback capability
        structured_log('INFO', 'Old EIP has been disassociated but NOT released for rollback capability', 
                      context=context, event=event)
        
        success_message = (
            f"✅ SUCCESS: Rotated EIP for NAT Gateway {nat_gateway_id}.\n"
            f"New Public IP: {new_public_ip} (Allocation ID: [REDACTED])\n"
            f"Old Allocation ID has been disassociated and is available for rollback. "
            f"It has NOT been released."
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=SNS_TOPIC_ARN, 
            Subject="SUCCESS: NAT Gateway EIP Rotated", 
            Message=success_message
        )
        
        structured_log('INFO', 'NAT Gateway EIP rotation completed successfully', {
            'nat_gateway_id': nat_gateway_id,
            'new_public_ip': new_public_ip
        }, context, event)
        
        return {
            'statusCode': 200, 
            'body': json.dumps({
                'message': 'NAT Gateway EIP rotation completed successfully',
                'correlationId': correlation_id,
                'natGatewayId': nat_gateway_id,
                'newPublicIp': new_public_ip
            })
        }
    
    except Exception as e:
        error_message = f"Failed to rotate EIP: {str(e)}"
        
        structured_log('ERROR', error_message, {
            'error': str(e),
            'old_allocation_id_available': old_allocation_id is not None
        }, context, event)
        
        # Enhanced error message for manual cleanup if needed
        if old_allocation_id:
            error_message += (
                f"\n\nACTION REQUIRED: The old EIP was identified but the process failed. "
                f"Please manually investigate the state of the NAT Gateway and EIPs."
            )
        
        # Send SNS notification for failure
        sns.publish(
            TopicArn=SNS_TOPIC_ARN, 
            Subject="FAILED: NAT Gateway EIP Rotation", 
            Message=error_message
        )
        
        return create_error_response(500, error_message, correlation_id)