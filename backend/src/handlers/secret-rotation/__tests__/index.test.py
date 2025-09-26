import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import os
import sys

# Add the handler directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from index import (
    lambda_handler,
    create_secret,
    set_secret,
    test_secret,
    finish_secret,
    generate_complex_password,
    get_correlation_id,
    scrub_sensitive_data,
    get_secret_dict
)


class TestSecretRotation(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_context = Mock()
        self.mock_context.aws_request_id = 'test-request-id-123'
        
        self.mock_event = {
            'SecretId': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
            'ClientRequestToken': 'test-token-123',
            'Step': 'createSecret'
        }
        
        # Set environment variables
        os.environ['OPENSEARCH_DOMAIN_NAME'] = 'test-domain'
        os.environ['OPENSEARCH_ENDPOINT'] = 'search-test.us-east-1.es.amazonaws.com'
        os.environ['AWS_REGION'] = 'us-east-1'
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up environment variables
        env_vars = ['OPENSEARCH_DOMAIN_NAME', 'OPENSEARCH_ENDPOINT', 'AWS_REGION']
        for var in env_vars:
            if var in os.environ:
                del os.environ[var]
    
    def test_get_correlation_id_from_context(self):
        """Test correlation ID extraction from context."""
        correlation_id = get_correlation_id(self.mock_context, self.mock_event)
        self.assertEqual(correlation_id, 'test-request-id-123')
    
    def test_scrub_sensitive_data(self):
        """Test sensitive data scrubbing."""
        test_data = {
            'opensearch_master_password': 'secret123',
            'opensearch_master_username': 'admin',
            'password': 'another_secret',
            'normal_field': 'visible_data',
            'nested': {
                'secret': 'hidden',
                'public': 'visible'
            }
        }
        
        scrubbed = scrub_sensitive_data(test_data)
        
        self.assertEqual(scrubbed['opensearch_master_password'], '[REDACTED]')
        self.assertEqual(scrubbed['opensearch_master_username'], '[REDACTED]')
        self.assertEqual(scrubbed['password'], '[REDACTED]')
        self.assertEqual(scrubbed['normal_field'], 'visible_data')
        self.assertEqual(scrubbed['nested']['secret'], '[REDACTED]')
        self.assertEqual(scrubbed['nested']['public'], 'visible')
    
    def test_generate_complex_password(self):
        """Test password generation."""
        password = generate_complex_password(24)
        
        self.assertEqual(len(password), 24)
        
        # Check for required character types
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_symbol = any(c in '!#$%&()*+,-.:;<=>?[]^_{|}~' for c in password)
        
        self.assertTrue(has_lower, "Password should contain lowercase letters")
        self.assertTrue(has_upper, "Password should contain uppercase letters")
        self.assertTrue(has_digit, "Password should contain digits")
        self.assertTrue(has_symbol, "Password should contain symbols")
        
        # Check that problematic characters are not included
        problematic_chars = '"/@\\\''
        for char in problematic_chars:
            self.assertNotIn(char, password, f"Password should not contain '{char}'")
    
    def test_generate_complex_password_minimum_length(self):
        """Test password generation with minimum length validation."""
        with self.assertRaises(ValueError):
            generate_complex_password(7)  # Less than minimum 8
    
    @patch('index.secretsmanager_client')
    def test_lambda_handler_create_secret(self, mock_sm_client):
        """Test lambda handler for createSecret step."""
        # Mock Secrets Manager responses
        mock_sm_client.describe_secret.return_value = {
            'RotationEnabled': True,
            'VersionIdsToStages': {
                'test-token-123': ['AWSPENDING']
            }
        }
        
        mock_sm_client.get_secret_value.return_value = {
            'SecretString': json.dumps({
                'opensearch_master_username': 'admin',
                'opensearch_master_password': 'old_password'
            })
        }
        
        mock_sm_client.put_secret_value.return_value = {}
        
        # Execute the handler
        result = lambda_handler(self.mock_event, self.mock_context)
        
        # Verify no exception was raised (function returns None on success)
        self.assertIsNone(result)
        
        # Verify Secrets Manager calls
        mock_sm_client.describe_secret.assert_called_once()
        mock_sm_client.get_secret_value.assert_called_once()
        mock_sm_client.put_secret_value.assert_called_once()
    
    @patch('index.secretsmanager_client')
    def test_lambda_handler_rotation_not_enabled(self, mock_sm_client):
        """Test lambda handler when rotation is not enabled."""
        # Mock Secrets Manager to return rotation disabled
        mock_sm_client.describe_secret.return_value = {
            'RotationEnabled': False,
            'VersionIdsToStages': {}
        }
        
        # Execute the handler and expect exception
        with self.assertRaises(ValueError) as context:
            lambda_handler(self.mock_event, self.mock_context)
        
        self.assertIn('not enabled for rotation', str(context.exception))
    
    @patch('index.secretsmanager_client')
    def test_lambda_handler_already_current(self, mock_sm_client):
        """Test lambda handler when version is already AWSCURRENT."""
        # Mock event with version already current
        event = self.mock_event.copy()
        
        mock_sm_client.describe_secret.return_value = {
            'RotationEnabled': True,
            'VersionIdsToStages': {
                'test-token-123': ['AWSCURRENT']
            }
        }
        
        # Execute the handler
        result = lambda_handler(event, self.mock_context)
        
        # Should return early without error
        self.assertIsNone(result)
    
    @patch('index.secretsmanager_client')
    def test_lambda_handler_invalid_step(self, mock_sm_client):
        """Test lambda handler with invalid step."""
        # Mock valid secret metadata
        mock_sm_client.describe_secret.return_value = {
            'RotationEnabled': True,
            'VersionIdsToStages': {
                'test-token-123': ['AWSPENDING']
            }
        }
        
        # Create event with invalid step
        invalid_event = self.mock_event.copy()
        invalid_event['Step'] = 'invalidStep'
        
        # Execute the handler and expect exception
        with self.assertRaises(ValueError) as context:
            lambda_handler(invalid_event, self.mock_context)
        
        self.assertIn('Invalid step parameter', str(context.exception))
    
    @patch('index.secretsmanager_client')
    def test_get_secret_dict_with_token(self, mock_sm_client):
        """Test getting secret dictionary with token."""
        mock_secret_data = {
            'opensearch_master_username': 'admin',
            'opensearch_master_password': 'test_password'
        }
        
        mock_sm_client.get_secret_value.return_value = {
            'SecretString': json.dumps(mock_secret_data)
        }
        
        result = get_secret_dict(
            mock_sm_client, 
            'test-arn', 
            'AWSPENDING', 
            'test-token',
            self.mock_context,
            self.mock_event
        )
        
        self.assertEqual(result, mock_secret_data)
        mock_sm_client.get_secret_value.assert_called_once_with(
            SecretId='test-arn',
            VersionId='test-token',
            VersionStage='AWSPENDING'
        )
    
    @patch('index.secretsmanager_client')
    def test_get_secret_dict_without_token(self, mock_sm_client):
        """Test getting secret dictionary without token."""
        mock_secret_data = {
            'opensearch_master_username': 'admin',
            'opensearch_master_password': 'test_password'
        }
        
        mock_sm_client.get_secret_value.return_value = {
            'SecretString': json.dumps(mock_secret_data)
        }
        
        result = get_secret_dict(
            mock_sm_client, 
            'test-arn', 
            'AWSCURRENT',
            context=self.mock_context,
            event=self.mock_event
        )
        
        self.assertEqual(result, mock_secret_data)
        mock_sm_client.get_secret_value.assert_called_once_with(
            SecretId='test-arn',
            VersionStage='AWSCURRENT'
        )
    
    @patch('index.boto3')
    @patch('index.secretsmanager_client')
    def test_set_secret(self, mock_sm_client, mock_boto3):
        """Test set_secret function."""
        # Mock secret data
        mock_secret_data = {
            'opensearch_master_password': 'new_password'
        }
        
        mock_sm_client.get_secret_value.return_value = {
            'SecretString': json.dumps(mock_secret_data)
        }
        
        # Mock OpenSearch client
        mock_opensearch_client = Mock()
        mock_boto3.client.return_value = mock_opensearch_client
        mock_opensearch_client.update_domain_config.return_value = {}
        
        # Execute set_secret
        set_secret(mock_sm_client, 'test-arn', 'test-token', self.mock_context, self.mock_event)
        
        # Verify OpenSearch update was called
        mock_opensearch_client.update_domain_config.assert_called_once_with(
            DomainName='test-domain',
            AdvancedSecurityOptions={
                'MasterUserOptions': {
                    'MasterUserPassword': 'new_password'
                }
            }
        )


if __name__ == '__main__':
    unittest.main()