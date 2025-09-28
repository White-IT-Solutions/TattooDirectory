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
