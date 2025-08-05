# Terraform File Deployment Guide

## Deployment Steps

### 1. Create Lambda Package Directory
```bash
mkdir -p infrastructure/modules/app/lambda-packages
```

### 2. Validate Configuration
```bash
cd infrastructure/environments/dev
terraform init
terraform validate
terraform plan
```

### 3. Test in Development
```bash
cd infrastructure/environments/dev
terraform apply
```

### 4. Apply to Production
```bash
cd infrastructure/environments/prod
terraform init
terraform validate
terraform plan
terraform apply
```

## Troubleshooting

### Common Issues

1. **State File Conflicts**: If you encounter state conflicts, use `terraform state mv` to move resources
2. **Missing Resources**: Check that all old files are removed and new files are in place
3. **Variable Errors**: Ensure environment-specific variables.tf files are created

### Validation Commands
```bash
# Check syntax
terraform fmt -check

# Validate configuration
terraform validate

# Plan without applying
terraform plan

# Check for drift
terraform refresh
```