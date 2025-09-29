# Terraform File Deployment Guide

## Prerequisites

- **Terraform**: This project requires Terraform version `>= 1.5`.

---

## Deployment Steps

### 1. Validate Configuration

```bash
cd infrastructure/environments/dev
terraform fmt -check
terraform init # Initializes the working directory, downloading required provider plugins
terraform validate
terraform plan
```

### 2. Test in Development

```bash
cd infrastructure/environments/dev
terraform apply
```

### 3. Apply to Production

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
4. **Provider Configuration Not Present**: If you see an error about a missing provider configuration (often with an `alias` like "replica"), it means a provider was removed before the resources it managed were destroyed. Temporarily re-add the provider block, run `terraform apply` to destroy the orphaned resources, and then remove the provider block again.

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