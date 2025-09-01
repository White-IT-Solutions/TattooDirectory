import boto3
import os
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables to be set in Lambda config
NAT_GATEWAY_TAG_VALUE = os.environ['NAT_GATEWAY_TAG_VALUE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

ec2 = boto3.client('ec2')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Finds a NAT Gateway by tag, allocates a new EIP,
    associates it, and disassociates the old EIP without releasing it to allow for rollback.
    """
    old_allocation_id = None
    try:
        # 1. Find the NAT Gateway by tag
        # Use a wildcard to match tags like 'my-app-nat-a', 'my-app-nat-b', etc.
        logger.info(f"Searching for NAT Gateway with tag Name starting with: {NAT_GATEWAY_TAG_VALUE}")
        response = ec2.describe_nat_gateways(
            Filters=[{'Name': 'tag:Name', 'Values': [f"{NAT_GATEWAY_TAG_VALUE}*"]}]
        )
        if not response['NatGateways']:
            raise Exception(f"No NAT Gateway found with tag Name={NAT_GATEWAY_TAG_VALUE}")
        
        nat_gateway = response['NatGateways'][0]
        nat_gateway_id = nat_gateway['NatGatewayId']
        logger.info(f"Found NAT Gateway: {nat_gateway_id}")
        
        if not nat_gateway.get('NatGatewayAddresses'):
            raise Exception(f"NAT Gateway {nat_gateway_id} has no associated EIPs.")
        
        old_association = nat_gateway['NatGatewayAddresses'][0]
        network_interface_id = old_association['NetworkInterfaceId']
        old_allocation_id = old_association['AllocationId']
        logger.info(f"Identified old EIP with AllocationId: {old_allocation_id}")
        
        # 2. Allocate a new EIP
        logger.info("Allocating new EIP for VPC scope.")
        new_eip_response = ec2.allocate_address(Domain='vpc')
        new_allocation_id = new_eip_response['AllocationId']
        new_public_ip = new_eip_response['PublicIp']
        logger.info(f"Allocated new EIP {new_public_ip} with AllocationId: {new_allocation_id}")
        
        # 3. Associate the new EIP
        logger.info(f"Associating new EIP with Network Interface: {network_interface_id}")
        ec2.associate_address(
            AllocationId=new_allocation_id,
            NetworkInterfaceId=network_interface_id
        )
        logger.info("Successfully associated new EIP. The old EIP is now disassociated.")
        
        # 4. Do NOT release the old EIP.
        # This aligns with the operational runbook, which specifies keeping the old EIP for rollback.
        # The old EIP should be managed (e.g., released after 24 hours) by a separate process.
        logger.info(f"Old EIP with AllocationId {old_allocation_id} has been disassociated. It will NOT be released to allow for rollback.")
        
        message = (
            f"✅ SUCCESS: Rotated EIP for NAT Gateway {nat_gateway_id}.\n"
            f"New Public IP: {new_public_ip} (Allocation ID: {new_allocation_id})\n"
            f"Old Allocation ID {old_allocation_id} has been disassociated and is available for rollback. "
            f"It has NOT been released."
        )
        
        sns.publish(TopicArn=SNS_TOPIC_ARN, Subject="SUCCESS: NAT Gateway EIP Rotated", Message=message)
        
        return {'statusCode': 200, 'body': json.dumps({'message': message})}
    
    except Exception as e:
        error_message = f"❌ FAILED to rotate EIP: {str(e)}"
        logger.error(error_message)
        # If the old EIP was identified but the process failed, include it in the error for manual cleanup.
        if old_allocation_id:
            error_message += (f"\n\nACTION REQUIRED: The old EIP ({old_allocation_id}) was not released. "
                              f"Please manually investigate the state of the NAT Gateway and EIPs.")
            
        sns.publish(TopicArn=SNS_TOPIC_ARN, Subject="FAILED: NAT Gateway EIP Rotation", Message=error_message)
        return {'statusCode': 500, 'body': json.dumps({'error': error_message})}