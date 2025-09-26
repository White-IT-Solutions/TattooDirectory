import boto3
import os
import json
import logging
import random
import string
from typing import Dict, Any, Optional
from datetime import datetime
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

secretsmanager_client = boto3.client('secretsmanager')


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
    return f"gen-{int(datetime.now().timestamp())}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"


def structured_log(level: str, message: str, data: Dict[str, Any] = None, context: Any = None, event: Dict[str, Any] = None) -> None:
    """
    Creates structured log entries with correlation ID support and PII scrubbing.
    
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
        'service': 'secret-rotation'
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
        'password', 'secret', 'key', 'token', 'credential', 'auth',
        'opensearch_master_password', 'opensearch_master_username',
        'master_user_password', 'secretstring', 'secretvalue'
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


def create_error_response(error_message: str, correlation_id: str) -> None:
    """
    Creates a standardized error response and raises an exception.
    
    Args:
        error_message: Error message
        correlation_id: Request correlation ID
    """
    structured_log('ERROR', error_message, {'correlationId': correlation_id})
    raise ValueError(f"{error_message} (Correlation ID: {correlation_id})")


def lambda_handler(event: Dict[str, Any], context: Any) -> None:
    """
    Secrets Manager Rotation Template for OpenSearch Master User
    
    Args:
        event: Lambda event containing SecretId, ClientRequestToken, and Step
        context: Lambda context object
    """
    correlation_id = get_correlation_id(context, event)
    
    try:
        arn = event['SecretId']
        token = event['ClientRequestToken']
        step = event['Step']
        
        structured_log('INFO', 'Starting secret rotation', {
            'step': step,
            'secret_arn': arn,
            'client_request_token': token
        }, context, event)

        metadata = secretsmanager_client.describe_secret(SecretId=arn)
        
        if not metadata['RotationEnabled']:
            error_msg = f"Secret {arn} is not enabled for rotation"
            create_error_response(error_msg, correlation_id)
        
        versions = metadata.get('VersionIdsToStages', {})
        if token not in versions:
            error_msg = f"Secret version {token} has no stage for rotation of secret {arn}"
            create_error_response(error_msg, correlation_id)
        
        if "AWSCURRENT" in versions[token]:
            structured_log('INFO', f'Secret version {token} already set as AWSCURRENT for secret {arn}', 
                          context=context, event=event)
            return
        elif "AWSPENDING" not in versions[token]:
            error_msg = f"Secret version {token} not set as AWSPENDING for rotation of secret {arn}"
            create_error_response(error_msg, correlation_id)

        if step == "createSecret":
            create_secret(secretsmanager_client, arn, token, context, event)
        elif step == "setSecret":
            set_secret(secretsmanager_client, arn, token, context, event)
        elif step == "testSecret":
            test_secret(secretsmanager_client, arn, token, context, event)
        elif step == "finishSecret":
            finish_secret(secretsmanager_client, arn, token, context, event)
        else:
            error_msg = f"Invalid step parameter: {step}"
            create_error_response(error_msg, correlation_id)
            
        structured_log('INFO', f'Secret rotation step {step} completed successfully', 
                      {'step': step}, context, event)
        
    except Exception as e:
        structured_log('ERROR', 'Secret rotation failed', {
            'error': str(e),
            'step': event.get('Step', 'unknown')
        }, context, event)
        raise


def create_secret(service_client: Any, arn: str, token: str, context: Any = None, event: Dict[str, Any] = None) -> None:
    """
    Create the secret with a new password.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
        context: Lambda context object
        event: Lambda event object
    """
    try:
        structured_log('INFO', 'Creating new secret version', {'arn': arn}, context, event)
        
        current_secret = get_secret_dict(service_client, arn, "AWSCURRENT", context=context, event=event)    
        new_password = generate_complex_password()

        current_secret['opensearch_master_password'] = new_password
        service_client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(current_secret),
            VersionStages=['AWSPENDING']
        )
        
        structured_log('INFO', 'Successfully created secret version', {'arn': arn}, context, event)
        
    except Exception as e:
        structured_log('ERROR', 'Failed to create secret', {
            'arn': arn,
            'error': str(e)
        }, context, event)
        raise


def generate_complex_password(length: int = 24) -> str:
    """
    Generate a secure, complex password.
    
    Args:
        length: Password length (minimum 8)
        
    Returns:
        Generated password string
    """
    if length < 8:
        raise ValueError("Password length must be at least 8 characters.")

    # Define character sets, excluding problematic characters like " / \ @ '
    lower = string.ascii_lowercase
    upper = string.ascii_uppercase
    digits = string.digits
    symbols = '!#$%&()*+,-.:;<=>?[]^_{|}~'
    all_chars = lower + upper + digits + symbols

    password = [random.choice(lower), random.choice(upper), random.choice(digits), random.choice(symbols)]
    password.extend(random.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle to avoid predictable patterns
    random.shuffle(password)
    return ''.join(password)


def set_secret(service_client: Any, arn: str, token: str, context: Any = None, event: Dict[str, Any] = None) -> None:
    """
    Update the OpenSearch domain with the new password.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
        context: Lambda context object
        event: Lambda event object
    """
    try:
        structured_log('INFO', 'Setting new secret in OpenSearch domain', {'arn': arn}, context, event)
        
        pending_secret = get_secret_dict(service_client, arn, "AWSPENDING", token, context, event)
        new_password = pending_secret['opensearch_master_password']
        
        domain_name = os.environ['OPENSEARCH_DOMAIN_NAME']
        opensearch_client = boto3.client('opensearch')
        
        structured_log('INFO', f'Updating master user password for OpenSearch domain {domain_name}', 
                      {'domain_name': domain_name}, context, event)
        
        opensearch_client.update_domain_config(
            DomainName=domain_name,
            AdvancedSecurityOptions={
                'MasterUserOptions': {
                    'MasterUserPassword': new_password
                }
            }
        )
        
        structured_log('INFO', f'Successfully updated master user password for domain {domain_name}', 
                      {'domain_name': domain_name}, context, event)
        
    except Exception as e:
        structured_log('ERROR', 'Failed to set secret in OpenSearch domain', {
            'arn': arn,
            'domain_name': os.environ.get('OPENSEARCH_DOMAIN_NAME', 'unknown'),
            'error': str(e)
        }, context, event)
        raise


def test_secret(service_client: Any, arn: str, token: str, context: Any = None, event: Dict[str, Any] = None) -> None:
    """
    Test the new secret by attempting to connect to OpenSearch.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
        context: Lambda context object
        event: Lambda event object
    """
    try:
        structured_log('INFO', 'Testing new secret connection to OpenSearch', {'arn': arn}, context, event)
        
        pending_secret = get_secret_dict(service_client, arn, "AWSPENDING", token, context, event)
        
        password = pending_secret.get('opensearch_master_password')
        username = pending_secret.get('opensearch_master_username')
        host = os.environ['OPENSEARCH_ENDPOINT']
        region = os.environ['AWS_REGION']
        
        if not all([password, username, host]):
            error_msg = "Secret is missing required values for testing (password, username, or endpoint)"
            structured_log('ERROR', error_msg, {
                'has_password': bool(password),
                'has_username': bool(username),
                'has_host': bool(host)
            }, context, event)
            raise ValueError(error_msg)

        # Use basic auth to test the new master user password
        client = OpenSearch(
            hosts=[{'host': host, 'port': 443}],
            http_auth=(username, password),
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )
        
        # A simple 'info' call is a good way to test credentials
        info = client.info()
        
        structured_log('INFO', 'Successfully connected to OpenSearch cluster', {
            'cluster_name': info.get('cluster_name', 'unknown')
        }, context, event)

    except Exception as e:
        structured_log('ERROR', 'Failed to test secret connection to OpenSearch', {
            'arn': arn,
            'error': str(e)
        }, context, event)
        raise


def finish_secret(service_client: Any, arn: str, token: str, context: Any = None, event: Dict[str, Any] = None) -> None:
    """
    Finalize the rotation by marking the pending version as current.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
        context: Lambda context object
        event: Lambda event object
    """
    try:
        structured_log('INFO', 'Finalizing secret rotation', {'arn': arn}, context, event)
        
        metadata = service_client.describe_secret(SecretId=arn)
        current_version = None
        
        for version, stages in metadata['VersionIdsToStages'].items():
            if "AWSCURRENT" in stages:
                if version == token:
                    structured_log('INFO', f'Version {version} already marked as AWSCURRENT for {arn}', 
                                  context=context, event=event)
                    return
                current_version = version
                break

        service_client.update_secret_version_stage(
            SecretId=arn,
            VersionStage="AWSCURRENT",
            MoveToVersionId=token,
            RemoveFromVersionId=current_version
        )
        
        structured_log('INFO', f'Successfully set AWSCURRENT stage to version {token} for secret {arn}', 
                      {'token': token}, context, event)
        
    except Exception as e:
        structured_log('ERROR', 'Failed to finish secret rotation', {
            'arn': arn,
            'error': str(e)
        }, context, event)
        raise


def get_secret_dict(service_client: Any, arn: str, stage: str, token: Optional[str] = None, 
                   context: Any = None, event: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Gets the secret value from Secrets Manager.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        stage: Version stage (AWSCURRENT or AWSPENDING)
        token: Optional client request token
        context: Lambda context object
        event: Lambda event object
        
    Returns:
        Dictionary containing secret values
    """
    try:
        structured_log('INFO', f'Retrieving secret {arn} at stage {stage}', 
                      {'stage': stage}, context, event)
        
        if token:
            secret = service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage=stage)
        else:
            secret = service_client.get_secret_value(SecretId=arn, VersionStage=stage)
        
        return json.loads(secret['SecretString'])
        
    except Exception as e:
        structured_log('ERROR', f'Failed to retrieve secret {arn} at stage {stage}', {
            'arn': arn,
            'stage': stage,
            'error': str(e)
        }, context, event)
        raise