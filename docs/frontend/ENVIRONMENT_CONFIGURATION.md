# Frontend Environment Configuration

This document explains how the frontend environment configuration works with the consolidated backend and Terraform deployment.

## Overview

The frontend now uses environment-specific API URLs that are automatically configured by the CI/CD pipeline based on Terraform outputs. This ensures that the frontend always connects to the correct backend API for each environment.

## Configuration Files

### Environment Files

- `.env.local` - Local development configuration
- `.env.production` - Production build configuration

### Configuration Helper

- `src/lib/config.js` - Centralized configuration management

## Environment Variables

### Required Variables

- `NEXT_PUBLIC_ENVIRONMENT` - The current environment (development, production)
- `NEXT_PUBLIC_API_URL_DEV` - API Gateway URL for development environment
- `NEXT_PUBLIC_API_URL_PROD` - API Gateway URL for production environment
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

### Optional Variables

- `NEXT_PUBLIC_API_URL` - Fallback API URL if environment-specific URLs are not set

## How It Works

### 1. Terraform Deployment

When Terraform deploys the infrastructure:

1. API Gateway is created with a unique URL
2. The URL is captured as a Terraform output
3. The URL is stored in AWS SSM Parameter Store
4. GitHub Actions workflows can access the URL for frontend builds

### 2. Frontend Build Process

When the frontend is built:

1. GitHub Actions retrieves the API Gateway URL from SSM Parameter Store
2. The URL is set as an environment variable during the build process
3. Next.js includes the URL in the static build
4. The built frontend is deployed to S3

### 3. Runtime Configuration

When the frontend runs:

1. The configuration helper (`src/lib/config.js`) determines the current environment
2. It selects the appropriate API URL based on the environment
3. The API client uses this URL for all backend requests

## Local Development

For local development:

1. The frontend automatically detects localhost and uses `http://localhost:3000`
2. You can override this by setting `NEXT_PUBLIC_API_URL` in `.env.local`
3. The backend API handler should be running locally on port 3000

## Environment Detection

The system uses multiple methods to detect the environment:

1. **Browser hostname** - If running on localhost, assumes local development
2. **NEXT_PUBLIC_ENVIRONMENT** - Explicit environment setting
3. **NODE_ENV** - Node.js environment variable
4. **Default** - Falls back to production if none of the above are set

## API URL Priority

The system uses the following priority for API URLs:

1. Environment-specific URL (`NEXT_PUBLIC_API_URL_DEV` or `NEXT_PUBLIC_API_URL_PROD`)
2. Generic API URL (`NEXT_PUBLIC_API_URL`)
3. Hardcoded fallback URL

## CI/CD Integration

### Terraform Workflows

The Terraform workflows (`terraform-dev.yaml`, `terraform-prod.yaml`) now:

1. Deploy infrastructure including API Gateway
2. Capture the API Gateway URL from Terraform outputs
3. Store the URL in SSM Parameter Store for the frontend build process

### Frontend Workflows

The frontend workflows (`frontend-dev.yaml`, `frontend-prod.yaml`):

1. Retrieve the API Gateway URL from SSM Parameter Store
2. Set it as an environment variable during the build
3. Build the static frontend with the correct API URL
4. Deploy the built frontend to S3

## Troubleshooting

### API URL Not Found

If the frontend can't connect to the backend:

1. Check that the Terraform deployment completed successfully
2. Verify the API Gateway URL is stored in SSM Parameter Store
3. Check the frontend build logs for the correct environment variables
4. Ensure the API Gateway is accessible and responding

### Environment Detection Issues

If the wrong environment is detected:

1. Set `NEXT_PUBLIC_ENVIRONMENT` explicitly in your environment file
2. Check the browser console for configuration debug information
3. Verify the hostname detection logic in `src/lib/config.js`

### Build Issues

If the frontend build fails:

1. Check that all required environment variables are set
2. Verify the API URL format is correct (should start with https://)
3. Check the Next.js configuration for static export settings

## Security Considerations

- API URLs are public (included in the frontend bundle)
- Sensitive configuration should use server-side environment variables
- Google Maps API key should be restricted to specific domains
- SSM Parameter Store uses encryption at rest with KMS keys

## Future Enhancements

- CloudFront cache invalidation after frontend deployments
- Automatic detection of CloudFront distribution ID
- Health check integration to verify API connectivity
- Environment-specific Google Maps API keys