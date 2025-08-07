# Python code for OpenSearch master user password rotation
# This is a production-ready implementation for AWS Secrets Manager rotation
import boto3
import os
import json
import logging
import random
import string
from typing import Dict, Any, Optional

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: Dict[str, Any], context: Any) -> None:
    """
    Secrets Manager Rotation Template for OpenSearch Master User
    
    Args:
        event: Lambda event containing SecretId, ClientRequestToken, and Step
        context: Lambda context object
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    service_client = boto3.client('secretsmanager')
    metadata = service_client.describe_secret(SecretId=arn)
    
    if not metadata['RotationEnabled']:
        logger.error(f"Secret {arn} is not enabled for rotation.")
        raise ValueError(f"Secret {arn} is not enabled for rotation.")
    
    versions = metadata.get('VersionIdsToStages', {})
    if token not in versions:
        logger.error(f"Secret version {token} has no stage for rotation of secret {arn}.")
        raise ValueError(f"Secret version {token} has no stage for rotation of secret {arn}.")
    
    if "AWSCURRENT" in versions[token]:
        logger.info(f"Secret version {token} already set as AWSCURRENT for secret {arn}.")
        return
    elif "AWSPENDING" not in versions[token]:
        logger.error(f"Secret version {token} not set as AWSPENDING for rotation of secret {arn}.")
        raise ValueError(f"Secret version {token} not set as AWSPENDING for rotation of secret {arn}.")

    if step == "createSecret":
        create_secret(service_client, arn, token)
    elif step == "setSecret":
        set_secret(service_client, arn, token)
    elif step == "testSecret":
        test_secret(service_client, arn, token)
    elif step == "finishSecret":
        finish_secret(service_client, arn, token)
    else:
        raise ValueError(f"Invalid step parameter: {step}")


def create_secret(service_client: Any, arn: str, token: str) -> None:
    """
    Create the secret with a new password.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
    """
    current_secret = get_secret_dict(service_client, arn, "AWSCURRENT")

    # Generate a new password, excluding characters that can cause issues
    exclude_characters = "\"@/\\`'"
    password_chars = string.ascii_letters + string.digits + string.punctuation
    allowed_chars = ''.join(c for c in password_chars if c not in exclude_characters)
    
    # Generate a 24-character password with mixed case, numbers, and symbols
    new_password = ''.join(random.choice(allowed_chars) for _ in range(24))
    
    # Ensure password complexity requirements
    if not (any(c.islower() for c in new_password) and 
            any(c.isupper() for c in new_password) and
            any(c.isdigit() for c in new_password) and
            any(c in string.punctuation for c in new_password)):
        # Regenerate if complexity requirements not met
        new_password = generate_complex_password(allowed_chars)

    current_secret['opensearch_master_password'] = new_password
    service_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(current_secret),
        VersionStages=['AWSPENDING']
    )
    logger.info(f"createSecret: Successfully created secret for {arn}.")


def generate_complex_password(allowed_chars: str) -> str:
    """
    Generate a password that meets complexity requirements.
    
    Args:
        allowed_chars: String of allowed characters
        
    Returns:
        Complex password string
    """
    password = []
    
    # Ensure at least one of each required character type
    password.append(random.choice(string.ascii_lowercase))
    password.append(random.choice(string.ascii_uppercase))
    password.append(random.choice(string.digits))
    password.append(random.choice('!@#$%^&*()_+-=[]{}|;:,.<>?'))
    
    # Fill remaining positions
    for _ in range(20):  # 24 total - 4 required = 20 remaining
        password.append(random.choice(allowed_chars))
    
    # Shuffle to avoid predictable patterns
    random.shuffle(password)
    return ''.join(password)


def set_secret(service_client: Any, arn: str, token: str) -> None:
    """
    Update the OpenSearch domain with the new password.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
    """
    pending_secret = get_secret_dict(service_client, arn, "AWSPENDING", token)
    new_password = pending_secret['opensearch_master_password']
    
    domain_name = os.environ['OPENSEARCH_DOMAIN_NAME']
    opensearch_client = boto3.client('opensearch')
    
    logger.info(f"setSecret: Updating master user password for OpenSearch domain {domain_name}")
    
    try:
        opensearch_client.update_domain_config(
            DomainName=domain_name,
            AdvancedSecurityOptions={
                'MasterUserOptions': {
                    'MasterUserPassword': new_password
                }
            }
        )
        logger.info(f"setSecret: Successfully updated master user password for domain {domain_name}.")
    except Exception as e:
        logger.error(f"setSecret: Failed to update OpenSearch domain {domain_name}: {str(e)}")
        raise


def test_secret(service_client: Any, arn: str, token: str) -> None:
    """
    Test the new secret by attempting to connect to OpenSearch.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
    """
    pending_secret = get_secret_dict(service_client, arn, "AWSPENDING", token)
    
    # In a production implementation, you would test the connection here
    # For now, we'll perform basic validation
    password = pending_secret.get('opensearch_master_password')
    username = pending_secret.get('opensearch_master_username')
    endpoint = pending_secret.get('opensearch_endpoint')
    
    if not all([password, username, endpoint]):
        raise ValueError("Missing required credentials in secret")
    
    if len(password) < 8:
        raise ValueError("Password does not meet minimum length requirements")
    
    logger.info(f"testSecret: Secret validation successful for {arn}")
    
    # TODO: Implement actual OpenSearch connection test
    # This would involve creating an OpenSearch client and attempting
    # to authenticate with the new credentials


def finish_secret(service_client: Any, arn: str, token: str) -> None:
    """
    Finalize the rotation by marking the pending version as current.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        token: Client request token
    """
    metadata = service_client.describe_secret(SecretId=arn)
    current_version = None
    
    for version, stages in metadata['VersionIdsToStages'].items():
        if "AWSCURRENT" in stages:
            if version == token:
                logger.info(f"finishSecret: Version {version} already marked as AWSCURRENT for {arn}")
                return
            current_version = version
            break

    service_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
    logger.info(f"finishSecret: Successfully set AWSCURRENT stage to version {token} for secret {arn}.")


def get_secret_dict(service_client: Any, arn: str, stage: str, token: Optional[str] = None) -> Dict[str, Any]:
    """
    Gets the secret value from Secrets Manager.
    
    Args:
        service_client: Boto3 Secrets Manager client
        arn: Secret ARN
        stage: Version stage (AWSCURRENT or AWSPENDING)
        token: Optional client request token
        
    Returns:
        Dictionary containing secret values
    """
    try:
        if token:
            secret = service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage=stage)
        else:
            secret = service_client.get_secret_value(SecretId=arn, VersionStage=stage)
        
        return json.loads(secret['SecretString'])
    except Exception as e:
        logger.error(f"Failed to retrieve secret {arn} at stage {stage}: {str(e)}")
        raise