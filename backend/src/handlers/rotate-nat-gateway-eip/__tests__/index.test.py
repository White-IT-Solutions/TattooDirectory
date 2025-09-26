import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import os
import sys

# Add the handler directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from index import (
    lambda_handler, 
    get_correlation_id, 
    structured_log, 
    scrub_sensitive_data,
    create_error_response
)


class TestRotateNatGatewayEip(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_context = Mock()
        self.mock_context.aws_request_id = 'test-request-id-123'
        
        self.mock_event = {
            'requestContext': {
                'requestId': 'test-event-request-id'
            }
        }
        
        # Set environment variables
        os.environ['NAT_GATEWAY_TAG_VALUE'] = 'test-nat-gateway'
        os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up environment variables
        if 'NAT_GATEWAY_TAG_VALUE' in os.environ:
            del os.environ['NAT_GATEWAY_TAG_VALUE']
        if 'SNS_TOPIC_ARN' in os.environ:
            del os.environ['SNS_TOPIC_ARN']
    
    def test_get_correlation_id_from_context(self):
        """Test correlation ID extraction from context."""
        correlation_id = get_correlation_id(self.mock_context, self.mock_event)
        self.assertEqual(correlation_id, 'test-request-id-123')
    
    def test_get_correlation_id_from_event(self):
        """Test correlation ID extraction from event when context is empty."""
        empty_context = Mock()
        empty_context.aws_request_id = None
        
        correlation_id = get_correlation_id(empty_context, self.mock_event)
        self.assertEqual(correlation_id, 'test-event-request-id')
    
    def test_get_correlation_id_generated(self):
        """Test correlation ID generation when neither context nor event provide one."""
        empty_context = Mock()
        empty_context.aws_request_id = None
        empty_event = {}
        
        correlation_id = get_correlation_id(empty_context, empty_event)
        self.assertTrue(correlation_id.startswith('gen-'))
    
    def test_scrub_sensitive_data(self):
        """Test sensitive data scrubbing."""
        test_data = {
            'allocation_id': 'eipalloc-12345',
            'network_interface_id': 'eni-67890',
            'public_data': 'this should remain',
            'password': 'secret123',
            'nested': {
                'secret': 'hidden',
                'normal': 'visible'
            }
        }
        
        scrubbed = scrub_sensitive_data(test_data)
        
        self.assertEqual(scrubbed['allocation_id'], '[REDACTED]')
        self.assertEqual(scrubbed['network_interface_id'], '[REDACTED]')
        self.assertEqual(scrubbed['public_data'], 'this should remain')
        self.assertEqual(scrubbed['password'], '[REDACTED]')
        self.assertEqual(scrubbed['nested']['secret'], '[REDACTED]')
        self.assertEqual(scrubbed['nested']['normal'], 'visible')
    
    def test_create_error_response(self):
        """Test error response creation."""
        error_response = create_error_response(500, 'Test error', 'test-correlation-id')
        
        self.assertEqual(error_response['statusCode'], 500)
        
        body = json.loads(error_response['body'])
        self.assertEqual(body['error'], 'Test error')
        self.assertEqual(body['correlationId'], 'test-correlation-id')
        self.assertIn('timestamp', body)
    
    @patch('index.sns')
    @patch('index.ec2')
    def test_lambda_handler_success(self, mock_ec2, mock_sns):
        """Test successful NAT Gateway EIP rotation."""
        # Mock EC2 responses
        mock_ec2.describe_nat_gateways.return_value = {
            'NatGateways': [{
                'NatGatewayId': 'nat-12345',
                'NatGatewayAddresses': [{
                    'NetworkInterfaceId': 'eni-67890',
                    'AllocationId': 'eipalloc-old123'
                }]
            }]
        }
        
        mock_ec2.allocate_address.return_value = {
            'AllocationId': 'eipalloc-new456',
            'PublicIp': '203.0.113.1'
        }
        
        mock_ec2.associate_address.return_value = {}
        mock_sns.publish.return_value = {}
        
        # Execute the handler
        result = lambda_handler(self.mock_event, self.mock_context)
        
        # Verify the result
        self.assertEqual(result['statusCode'], 200)
        
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'NAT Gateway EIP rotation completed successfully')
        self.assertEqual(body['correlationId'], 'test-request-id-123')
        self.assertEqual(body['natGatewayId'], 'nat-12345')
        self.assertEqual(body['newPublicIp'], '203.0.113.1')
        
        # Verify EC2 calls
        mock_ec2.describe_nat_gateways.assert_called_once()
        mock_ec2.allocate_address.assert_called_once_with(Domain='vpc')
        mock_ec2.associate_address.assert_called_once_with(
            AllocationId='eipalloc-new456',
            NetworkInterfaceId='eni-67890'
        )
        
        # Verify SNS notification
        mock_sns.publish.assert_called_once()
        sns_call_args = mock_sns.publish.call_args[1]
        self.assertEqual(sns_call_args['TopicArn'], 'arn:aws:sns:us-east-1:123456789012:test-topic')
        self.assertEqual(sns_call_args['Subject'], 'SUCCESS: NAT Gateway EIP Rotated')
    
    @patch('index.sns')
    @patch('index.ec2')
    def test_lambda_handler_no_nat_gateway_found(self, mock_ec2, mock_sns):
        """Test handler when no NAT Gateway is found."""
        # Mock EC2 to return no NAT Gateways
        mock_ec2.describe_nat_gateways.return_value = {'NatGateways': []}
        mock_sns.publish.return_value = {}
        
        # Execute the handler
        result = lambda_handler(self.mock_event, self.mock_context)
        
        # Verify error response
        self.assertEqual(result['statusCode'], 500)
        
        body = json.loads(result['body'])
        self.assertIn('No NAT Gateway found', body['error'])
        self.assertEqual(body['correlationId'], 'test-request-id-123')
        
        # Verify SNS error notification
        mock_sns.publish.assert_called_once()
        sns_call_args = mock_sns.publish.call_args[1]
        self.assertEqual(sns_call_args['Subject'], 'FAILED: NAT Gateway EIP Rotation')
    
    @patch('index.sns')
    @patch('index.ec2')
    def test_lambda_handler_nat_gateway_no_eips(self, mock_ec2, mock_sns):
        """Test handler when NAT Gateway has no associated EIPs."""
        # Mock EC2 to return NAT Gateway without EIPs
        mock_ec2.describe_nat_gateways.return_value = {
            'NatGateways': [{
                'NatGatewayId': 'nat-12345',
                'NatGatewayAddresses': []
            }]
        }
        mock_sns.publish.return_value = {}
        
        # Execute the handler
        result = lambda_handler(self.mock_event, self.mock_context)
        
        # Verify error response
        self.assertEqual(result['statusCode'], 500)
        
        body = json.loads(result['body'])
        self.assertIn('has no associated EIPs', body['error'])
        
        # Verify SNS error notification
        mock_sns.publish.assert_called_once()


if __name__ == '__main__':
    unittest.main()