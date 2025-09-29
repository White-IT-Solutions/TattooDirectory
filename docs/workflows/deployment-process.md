# Deployment Process

## Infrastructure
Deployment uses Terraform for infrastructure as code:

```bash
cd infrastructure
terraform plan
terraform apply
```

## CI/CD Pipeline
GitHub Actions handles automated testing and deployment.

## Environments
- Development: LocalStack
- Staging: AWS staging environment
- Production: AWS production environment
