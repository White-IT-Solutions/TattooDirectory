#!/bin/bash
#
# rotate-nat-eip-manual.sh
#
# This script automates the manual fallback procedure for rotating the Elastic IP (EIP)
# of the primary NAT Gateway. It is intended to be used when the primary automated
# Lambda function fails or is unavailable.
#
# The script performs the following actions:
# 1. Finds the Network Interface ID of the NAT Gateway tagged with 'Name: TAD-MVP-NAT-Gateway'.
# 2. Allocates a new Elastic IP address in the VPC.
# 3. Associates the new EIP with the NAT Gateway's network interface.
#
# It includes error handling to prevent leaving the system in an inconsistent state.

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u

# --- Configuration ---
# The tag key used to identify the NAT Gateway.
NAT_GATEWAY_TAG_KEY="Name"
# The tag value used to identify the NAT Gateway.
NAT_GATEWAY_TAG_VALUE="TAD-MVP-NAT-Gateway"
# The AWS Region where the resources are located.
# Update this if your environment uses a different region.
AWS_REGION="eu-west-2"

# --- Script Body ---
echo "--- Starting Manual NAT Gateway EIP Rotation ---"
echo "Region: ${AWS_REGION}"
echo "NAT Gateway Tag: ${NAT_GATEWAY_TAG_KEY}=${NAT_GATEWAY_TAG_VALUE}"
echo ""

# Step 1: Find the NAT Gateway's Network Interface ID
echo "➡️ Step 1: Finding Network Interface ID for the NAT Gateway..."
NETWORK_INTERFACE_ID=$(aws ec2 describe-nat-gateways \
  --region "${AWS_REGION}" \
  --filter "Name=tag:${NAT_GATEWAY_TAG_KEY},Values=${NAT_GATEWAY_TAG_VALUE}" \
  --query "NatGateways[0].NatGatewayAddresses[0].NetworkInterfaceId" \
  --output text)

if [ "${NETWORK_INTERFACE_ID}" == "None" ] || [ -z "${NETWORK_INTERFACE_ID}" ]; then
  echo "❌ ERROR: Could not find a NAT Gateway with tag '${NAT_GATEWAY_TAG_KEY}=${NAT_GATEWAY_TAG_VALUE}' in region ${AWS_REGION}."
  echo "Please check the tags on your NAT Gateway and the AWS_REGION variable in this script."
  exit 1
fi
echo "✅ Found Network Interface ID: ${NETWORK_INTERFACE_ID}"
echo ""

# Step 2: Allocate a new Elastic IP
echo "➡️ Step 2: Allocating a new Elastic IP..."
# The 'trap' command ensures that if the script exits unexpectedly after this point,
# the newly allocated EIP will be released to avoid orphaned resources and unnecessary costs.
trap 'echo "Releasing allocated EIP ${NEW_EIP_ALLOCATION_ID} due to script error." && aws ec2 release-address --allocation-id "${NEW_EIP_ALLOCATION_ID}" --region "${AWS_REGION}"' ERR EXIT

NEW_EIP_ALLOCATION_ID=$(aws ec2 allocate-address \
  --region "${AWS_REGION}" \
  --domain vpc \
  --query "AllocationId" \
  --output text)

if [ -z "${NEW_EIP_ALLOCATION_ID}" ]; then
  echo "❌ ERROR: Failed to allocate a new Elastic IP."
  trap - EXIT # Clear the trap as there's nothing to clean up
  exit 1
fi
echo "✅ Allocated new EIP. Allocation ID: ${NEW_EIP_ALLOCATION_ID}"
echo ""

# Step 3: Associate the new EIP with the NAT Gateway's Network Interface
echo "➡️ Step 3: Associating new EIP with Network Interface ${NETWORK_INTERFACE_ID}..."
aws ec2 associate-address \
  --region "${AWS_REGION}" \
  --allocation-id "${NEW_EIP_ALLOCATION_ID}" \
  --network-interface-id "${NETWORK_INTERFACE_ID}"

# If we've reached this point, the association was successful, so we can disable the trap.
trap - EXIT

echo "✅ Successfully associated new EIP."
echo ""
echo "--- EIP Rotation Complete ---"



# Lambda function fails or is unavailable.
#
# The script performs the following actions:
# 1. Finds the Network Interface ID of the specified NAT Gateway.
# 2. Allocates a new Elastic IP address in the VPC.
# 3. Associates the new EIP with the NAT Gateway's network interface.
#
Unchanged linesset -u

# --- Configuration ---
# The AWS Region where the resources are located.
# Update this if your environment uses a different region.
AWS_REGION="eu-west-2"

# --- Script Body ---

# Step 1: Validate input
if [ "$#" -ne 1 ]; then
    echo "❌ ERROR: Incorrect usage."
    echo "Usage: $0 <nat_gateway_id>"
    echo "Example: $0 nat-0123456789abcdef0"
    exit 1
fi

NAT_GATEWAY_ID=$1

echo "--- Starting Manual NAT Gateway EIP Rotation ---"
echo "Region: ${AWS_REGION}"
echo "Target NAT Gateway ID: ${NAT_GATEWAY_ID}"
echo ""

# Step 2: Find the NAT Gateway's Network Interface ID
echo "➡️ Step 2: Finding Network Interface ID for NAT Gateway ${NAT_GATEWAY_ID}..."
NETWORK_INTERFACE_ID=$(aws ec2 describe-nat-gateways \
  --region "${AWS_REGION}" \
  --filter "Name=tag:${NAT_GATEWAY_TAG_KEY},Values=${NAT_GATEWAY_TAG_VALUE}" \
  --nat-gateway-ids "${NAT_GATEWAY_ID}" \
  --query "NatGateways[0].NatGatewayAddresses[0].NetworkInterfaceId" \
  --output text)

if [ "${NETWORK_INTERFACE_ID}" == "None" ] || [ -z "${NETWORK_INTERFACE_ID}" ] || [ ! -n "${NETWORK_INTERFACE_ID}" ]; then
  echo "❌ ERROR: Could not find a NAT Gateway with ID '${NAT_GATEWAY_ID}' in region ${AWS_REGION}."
  exit 1
if
echo "✅ Found Network Interface ID: ${NETWORK_INTERFACE_ID}"
echo ""

# Step 3: Allocate a new Elastic IP
echo "➡️ Step 3: Allocating a new Elastic IP..."
# The 'trap' command ensures that if the script exits unexpectedly after this point,
# the newly allocated EIP will be released to avoid orphaned resources and unnecessary costs.
trap 'echo "Releasing allocated EIP ${NEW_EIP_ALLOCATION_ID} due to script error." && aws ec2 release-address --allocation-id "${NEW_EIP_ALLOCATION_ID}" --region "${AWS_REGION}"' ERR EXIT
Unchanged linesecho "✅ Allocated new EIP. Allocation ID: ${NEW_EIP_ALLOCATION_ID}"
echo ""

# Step 4: Associate the new EIP with the NAT Gateway's Network Interface
echo "➡️ Step 4: Associating new EIP with Network Interface ${NETWORK_INTERFACE_ID}..."
aws ec2 associate-address \
  --region "${AWS_REGION}" \
  --allocation-id "${NEW_EIP_ALLOCATION_ID}" \

