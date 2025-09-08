# Module 06-IAM Refactoring Summary

## Completed Tasks ✅

### 1. Clarified Module Purpose
- **Target Account**: Infrastructure Account only
- **Purpose**: Create all necessary IAM roles for Infrastructure Account resources
- **Scope**: Application roles (Lambda, ECS, Step Functions) + Cross-account service roles

### 2. Added Cross-Account Trust Policies
- **Config Role**: Now allows Security Account to assume role for centralized AWS Config management
- **Backup Role**: Now allows Security Account to assume role for centralized AWS Backup management
- **External IDs**: Added for secure cross-account role assumption

### 3. Updated Variables
- **Added**: `security_account_id` to context object
- **Purpose**: Enable cross-account trust policy configuration

### 4. Enhanced Security
- **External ID Conditions**: Prevent confused deputy attacks in cross-account scenarios
- **Least Privilege**: Maintains existing resource-level permissions
- **Clear Separation**: Application vs. service roles clearly defined

## Key Architecture Changes 🏗️

### Before Refactoring
```
06-iam (Single Account)
├── Lambda roles (local access only)
├── ECS roles (local access only)
├── Config role (local service only)
└── Backup role (local service only)
```

### After Refactoring
```
06-iam (Infrastructure Account)
├── Lambda roles (local access)
├── ECS roles (local access)
├── Config role (cross-account assumable)
└── Backup role (cross-account assumable)
```

## Cross-Account Integration 🔗

### Config Role Trust Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "config.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::SECURITY_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "PROJECT-ENV-config-cross-account"
        }
      }
    }
  ]
}
```

### Backup Role Trust Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "backup.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::SECURITY_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "PROJECT-ENV-backup-cross-account"
        }
      }
    }
  ]
}
```

## Benefits Achieved 🎯

1. **Centralized Governance**: Security Account can manage Config and Backup across accounts
2. **Secure Cross-Account Access**: External IDs prevent confused deputy attacks
3. **Application Isolation**: Lambda/ECS roles remain in Infrastructure Account
4. **Clear Responsibilities**: Infrastructure vs. Security Account role separation
5. **Backward Compatible**: No breaking changes to existing application roles

## Role Categories After Refactoring

### Application Roles (Infrastructure Account Only)
- **Lambda Roles**: API, Sync, Discover Studios, Find Artists, Queue Scraping, NAT EIP Rotation
- **ECS Roles**: Task Execution, Task Role
- **Step Functions Role**: Workflow orchestration
- **S3 Replication Role**: Cross-region data replication

### Service Roles (Cross-Account Assumable)
- **Config Role**: AWS Config service can assume from Security Account
- **Backup Role**: AWS Backup service can assume from Security Account

## Security Considerations 🔒

### External ID Usage
- **Config External ID**: `{name_prefix}-config-cross-account`
- **Backup External ID**: `{name_prefix}-backup-cross-account`
- **Purpose**: Prevent unauthorized cross-account access

### Trust Policy Conditions
- **StringEquals**: Ensures exact match of external ID
- **Account Restriction**: Only Security Account can assume roles
- **Service Restriction**: Original service principals maintained

## Integration Points 🔌

### Security Account Services
When deploying governance/backup modules to Security Account, they will:
1. Use the cross-account role ARNs from this module
2. Provide the external IDs when assuming roles
3. Access Infrastructure Account resources through these roles

### Example Usage in Security Account
```hcl
# In Security Account governance module
resource "aws_config_configuration_recorder" "main" {
  name     = "main-recorder"
  role_arn = var.infra_account_config_role_arn  # From this module
  
  # External ID will be used in assume role calls
}
```

## Next Steps 📋

### 1. Update Environment Configuration
The dev environment already has the correct context structure with `security_account_id`.

### 2. Test Cross-Account Role Assumption
1. Deploy IAM roles to Infrastructure Account
2. Test role assumption from Security Account
3. Verify external ID validation works

### 3. Update Dependent Modules
Modules that will use these cross-account roles:
- **10-backup**: Will assume backup role from Security Account
- **11-governance**: Will assume config role from Security Account

### 4. Document Cross-Account Procedures
Create runbooks for:
- Cross-account role assumption procedures
- External ID management
- Troubleshooting cross-account access issues

## Files Modified

### Modified Files
- `modules/06-iam/main.tf` (added cross-account trust policies)
- `modules/06-iam/variables.tf` (added security_account_id)
- `modules/06-iam/outputs.tf` (added external ID outputs)

### No New Files Created
This refactoring enhanced the existing module rather than splitting it.

## Testing Checklist ✅

- [ ] `terraform plan` shows no errors
- [ ] Config role created with cross-account trust policy
- [ ] Backup role created with cross-account trust policy
- [ ] External IDs output correctly
- [ ] All existing application roles unchanged
- [ ] Cross-account role assumption works from Security Account
- [ ] External ID validation prevents unauthorized access

## Compliance Benefits 📋

1. **Separation of Duties**: Security team controls governance from Security Account
2. **Centralized Compliance**: Config and Backup managed centrally
3. **Audit Trail**: Cross-account actions logged with external IDs
4. **Least Privilege**: Roles maintain minimum necessary permissions
5. **Defense in Depth**: External IDs add additional security layer