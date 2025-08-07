import boto3
import os
import json
from datetime import datetime

# Environment variables to be set in Lambda config
NAT_GATEWAY_TAG_VALUE = os.environ['NAT_GATEWAY_TAG_VALUE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

ec2 = boto3.client('ec2')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Finds a NAT Gateway by tag, allocates a new EIP,
    and associates it, disassociating the old one.
    """
    try:
        # 1. Find the NAT Gateway by tag
        response = ec2.describe_nat_gateways(
            Filters=[{'Name': 'tag:Name', 'Values': [NAT_GATEWAY_TAG_VALUE]}]
        )
        if not response['NatGateways']:
            raise Exception(f"No NAT Gateway found with tag Name={NAT_GATEWAY_TAG_VALUE}")

        nat_gateway = response['NatGateways'][0]
        nat_gateway_id = nat_gateway['NatGatewayId']
          
        if not nat_gateway.get('NatGatewayAddresses'):
             raise Exception(f"NAT Gateway {nat_gateway_id} has no associated EIPs.")

        old_association = nat_gateway['NatGatewayAddresses'][0]
        network_interface_id = old_association['NetworkInterfaceId']
        old_allocation_id = old_association['AllocationId']

        # 2. Allocate a new EIP
        new_eip_response = ec2.allocate_address(Domain='vpc')
        new_allocation_id = new_eip_response['AllocationId']
        new_public_ip = new_eip_response['PublicIp']

        # 3. Associate the new EIP
        ec2.associate_address(
            AllocationId=new_allocation_id,
            NetworkInterfaceId=network_interface_id
        )

        message = (
            f"✅ SUCCESS: Rotated EIP for NAT Gateway {nat_gateway_id}.\n"
            f"New Public IP: {new_public_ip} (Allocation ID: {new_allocation_id})\n"
            f"Old Allocation ID was: {old_allocation_id}. It has been disassociated."
        )
          
        sns.publish(TopicArn=SNS_TOPIC_ARN, Subject="SUCCESS: NAT Gateway EIP Rotated", Message=message)

        return {'statusCode': 200, 'body': json.dumps({'message': message})}

    except Exception as e:
        error_message = f"❌ FAILED to rotate EIP: {str(e)}"
        sns.publish(TopicArn=SNS_TOPIC_ARN, Subject="FAILED: NAT Gateway EIP Rotation", Message=error_message)
        return {'statusCode': 500, 'body': json.dumps({'error': error_message})}