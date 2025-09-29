# Frontend CI/CD Integration

This document outlines the CI/CD integration setup for the frontend Next.js application.

## Overview

The frontend CI/CD pipeline automates the build, test, and deployment process for the Next.js application, ensuring consistent deployments and quality assurance.

## Pipeline Stages

### 1. Build Stage
- **Node.js Setup**: Uses Node.js 18+ with npm caching
- **Dependency Installation**: `npm ci` for reproducible builds
- **Type Checking**: TypeScript compilation and type validation
- **Linting**: ESLint and Prettier checks
- **Build**: Next.js production build with optimization

### 2. Test Stage
- **Unit Tests**: Jest and React Testing Library
- **Component Tests**: Isolated component testing
- **Integration Tests**: API integration testing with MSW
- **Coverage Reports**: Minimum 80% coverage requirement

### 3. Quality Assurance
- **Lighthouse CI**: Performance, accessibility, and SEO audits
- **Bundle Analysis**: Size analysis and optimization checks
- **Security Scanning**: Dependency vulnerability checks
- **Code Quality**: SonarQube or similar analysis

### 4. Deployment Stage
- **Environment Variables**: Secure injection of runtime configs
- **Static Asset Optimization**: Image optimization and CDN upload
- **Deployment**: Automated deployment to staging/production
- **Health Checks**: Post-deployment validation

## Environment Configuration

### Development
```yaml
NODE_ENV: development
NEXT_PUBLIC_API_URL: http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT: development
```

### Staging
```yaml
NODE_ENV: production
NEXT_PUBLIC_API_URL: https://api-staging.tattoo-directory.com
NEXT_PUBLIC_ENVIRONMENT: staging
```

### Production
```yaml
NODE_ENV: production
NEXT_PUBLIC_API_URL: https://api.tattoo-directory.com
NEXT_PUBLIC_ENVIRONMENT: production
```

---

*This CI/CD integration ensures reliable and automated deployment processes for the frontend application.*

# CI/CD Phase 2 ECR Scraper Implementation Guide

Container Image Compatibility and CI/CD Pipeline Implementation for the Tattoo Directory MVP.

## Container Image Compatibility

This is the primary technical requirement. A Docker image built for an x86 processor will not run on a Graviton (ARM64) processor.

### Multi-Architecture Builds
The best practice is to build a multi-architecture container image. This single image manifest contains layers for both linux/amd64 (x86) and linux/arm64. When you deploy, the container runtime (Fargate, in this case) automatically pulls the correct version for its underlying architecture. This gives you maximum flexibility.

### Base Image Requirements
You must ensure your Dockerfile starts from a base image that supports ARM64. Most official images (like node, python, amazonlinux) provide multi-architecture variants.

### Dependencies
Your application code itself (Node.js) is architecture-agnostic. However, if any of your npm packages include native C++ add-ons (e.g., some image processing or cryptography libraries), you must ensure they provide pre-compiled binaries for ARM64 or can be compiled for ARM64 during your build process. Your current dependencies (@opensearch-project/opensearch, @aws-sdk/*) are pure JavaScript and fully compatible.

## CI/CD Pipeline Adjustments

### Use docker buildx
This is the recommended approach for building multi-architecture images.

Buildx is a Docker CLI plugin that can build for multiple platforms simultaneously, even on an x86 build agent (using QEMU for emulation). This is the easiest way to create a multi-architecture image.

Use a Native ARM Builder: You can configure your CI/CD pipeline (e.g., in AWS CodeBuild or GitHub Actions) to use an ARM-based runner. This will build the ARM64 image natively, which is typically faster than using emulation.

```bash
# Enable buildx
docker buildx create --use

# Build multi-architecture image
docker buildx build --platform linux/amd64,linux/arm64 -t ${aws_ecr_repository.scraper.repository_url}:${var.scraper_image_tag} --push .
```

### Pipeline Configuration
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build and push multi-arch image
        uses: docker/build-push-action@v5
        with:
          platforms: linux/amd64,linux/arm64
          push: true
          tags: your-registry/your-image:latest
```

---

*This implementation guide ensures compatibility across different processor architectures.*