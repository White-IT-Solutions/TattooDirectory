#!/bin/bash
#
# rollback-nat-eip-manual.sh
#
# This script automates the manual rollback procedure for the NAT Gateway EIP.
# It re-associates a previously used Elastic IP (EIP) with the NAT Gateway's
# network interface. This is used to revert an EIP rotation if it causes issues.
#
# Usage:
# ./rollback-nat-eip-manual.sh <nat_gateway_id> <old_eip_allocation_id>
#
# The script performs the following actions:
# 1. Validates that an EIP Allocation ID is provided as an argument.
# 2. Finds the Network Interface ID of the specified NAT Gateway.
# 3. Associates the provided EIP with the NAT Gateway's network interface.

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u

# --- Configuration ---
# The AWS Region where the resources are located.
AWS_REGION="eu-west-2"

# --- Script Body ---

# Step 1: Validate input
if [ "$#" -ne 2 ]; then
    echo "❌ ERROR: Incorrect usage."
    echo "Usage: $0 <nat_gateway_id> <old_eip_allocation_id>"
    echo "Example: $0 nat-0123456789abcdef0 eipalloc-0123456789abcdef0"
    exit 1
fi

NAT_GATEWAY_ID=$1
OLD_EIP_ALLOCATION_ID=$2

echo "--- Starting Manual NAT Gateway EIP Rollback ---"
echo "Region: ${AWS_REGION}"
echo "Target NAT Gateway ID: ${NAT_GATEWAY_ID}"
echo "Target EIP Allocation ID to re-associate: ${OLD_EIP_ALLOCATION_ID}"
echo ""

# Step 2: Find the NAT Gateway's Network Interface ID
echo "➡️ Step 2: Finding Network Interface ID for NAT Gateway ${NAT_GATEWAY_ID}..."
NETWORK_INTERFACE_ID=$(aws ec2 describe-nat-gateways \
  --region "${AWS_REGION}" \
  --nat-gateway-ids "${NAT_GATEWAY_ID}" \
  --query "NatGateways[0].NatGatewayAddresses[0].NetworkInterfaceId" \
  --output text)

if [ "${NETWORK_INTERFACE_ID}" == "None" ] || [ -z "${NETWORK_INTERFACE_ID}" ] || [ ! -n "${NETWORK_INTERFACE_ID}" ]; then
  echo "❌ ERROR: Could not find a NAT Gateway with ID '${NAT_GATEWAY_ID}' in region ${AWS_REGION}."
  exit 1
fi
echo "✅ Found Network Interface ID: ${NETWORK_INTERFACE_ID}"
echo ""

# Step 3: Associate the old EIP with the NAT Gateway's Network Interface
echo "➡️ Step 3: Re-associating old EIP ${OLD_EIP_ALLOCATION_ID} with Network Interface ${NETWORK_INTERFACE_ID}..."
aws ec2 associate-address \
  --region "${AWS_REGION}" \
  --allocation-id "${OLD_EIP_ALLOCATION_ID}" \
  --network-interface-id "${NETWORK_INTERFACE_ID}"

echo "✅ Successfully re-associated old EIP."
echo ""
echo "--- EIP Rollback Complete ---"