# API Module (13-api)

## Overview
The API module creates and configures Amazon API Gateway HTTP API for the tattoo artist directory application. It provides RESTful endpoints for frontend integration, handles CORS configuration, implements throttling, and supports custom domain setup.

## Purpose
- Provides HTTP API endpoints for frontend application integration
- Handles authentication and authorization for protected endpoints
- Implements rate limiting and throttling for API protection
- Supports custom domain configuration for production deployments

## Resources Created

### API Gateway HTTP API
- **aws_apigatewayv2_api.main**: Main HTTP API with CORS configuration
- **aws_apigatewayv2_stage.main**: API stage for environment-specific deployment
- **aws_apigatewayv2_deployment.main**: Controlled deployment for production
- **aws_apigatewayv2_integration.lambda**: Lambda proxy integration

### API Routes
- **aws_apigatewayv2_route.proxy**: Catch-all route for Lambda integration
- **aws_apigatewayv2_route.health**: Public health check endpoint
- **aws_apigatewayv2_route.artists**: Public artist listing endpoint
- **aws_apigatewayv2_route.artist_by_id**: Public artist profile endpoint
- **aws_apigatewayv2_route.search**: Public search endpoint

### Custom Domain (Optional)
- **aws_apigatewayv2_domain_name.main**: Custom domain configuration
- **aws_apigatewayv2_api_mapping.main**: Maps API to custom domain
- **aws_route53_record.api**: DNS record for custom domain

### Lambda Integration
- **aws_lambda_permission.api_gateway**: Allows API Gateway to invoke Lambda

## Key Features

### CORS Configuration
- **Allowed Origins**: Configurable list of frontend domains
- **Allowed Methods**: All HTTP methods supported
- **Allowed Headers**: Standard headers plus custom authentication headers
- **Credentials**: CORS credentials disabled for security
- **Max Age**: 24-hour preflight cache

### Route Configuration
- **Public Routes**: Health check, artist listings, search (no authentication)
- **Protected Routes**: Administrative functions (IAM authentication)
- **Catch-All Route**: Handles all other requests via Lambda proxy

### Throttling and Rate Limiting
- **Burst Limit**: 5000 requests (prod), 100 requests (dev)
- **Rate Limit**: 2000 requests/second (prod), 50 requests/second (dev)
- **Per-Route Limits**: Individual limits can be configured per route

### Environment-Specific Behavior
- **Development**: Auto-deploy enabled for rapid iteration
- **Production**: Controlled deployments with explicit deployment resources

## API Endpoints

### Public Endpoints (No Authentication)
- **GET /health**: Health check endpoint for monitoring
- **GET /artists**: List artists with pagination and filtering
- **GET /artists/{id}**: Get specific artist profile
- **GET /search**: Search artists by location, style, keywords

### Protected Endpoints (IAM Authentication)
- **POST /artists**: Create new artist profile (admin only)
- **PUT /artists/{id}**: Update artist profile (admin only)
- **DELETE /artists/{id}**: Delete artist profile (admin only)

### Proxy Routes
- **ANY /{proxy+}**: Catch-all route handled by Lambda function

## CORS Configuration Details

### Allowed Origins
- Development: `http://localhost:3000`, `http://localhost:3001`
- Production: Custom domain, CloudFront distribution domain
- Configurable via `api_cors_allowed_origins` variable

### Allowed Headers
- Standard headers: `content-type`, `authorization`
- AWS headers: `x-amz-date`, `x-amz-security-token`, `x-amz-user-agent`
- Custom headers: `x-api-key` for API key authentication

## Dependencies
- **Compute Module**: Requires Lambda function ARN and name
- **Central Logging Module**: Uses API Gateway log group ARN
- **Networking Module**: Uses ACM certificate for custom domain

## Outputs
- **api_gateway_id**: API Gateway ID for monitoring and configuration
- **api_gateway_endpoint**: API endpoint URL for frontend configuration
- **api_gateway_stage_arn**: Stage ARN for CloudWatch logging
- **custom_domain_name**: Custom domain name if configured

## Integration with Other Modules

### Compute Module
- API Gateway integrates with Lambda API handler function
- Lambda proxy integration handles all API logic

### Central Logging Module
- API access logs sent to centralized CloudWatch Log Group
- Enables cross-account security monitoring

### Delivery Module
- CloudFront distribution routes `/v1/*` paths to API Gateway
- Provides global edge caching for API responses

### App Monitoring Module
- CloudWatch metrics monitor API performance and errors
- Alarms trigger on high error rates or latency

## Access Logging Configuration

### Log Format
```json
{
  "requestId": "$context.requestId",
  "ip": "$context.identity.sourceIp", 
  "requestTime": "$context.requestTime",
  "httpMethod": "$context.httpMethod",
  "routeKey": "$context.routeKey",
  "status": "$context.status",
  "protocol": "$context.protocol",
  "responseLength": "$context.responseLength",
  "errorMessage": "$context.error.message",
  "errorType": "$context.error.messageString"
}
```

### Log Destination
- **Development**: Local CloudWatch Log Group
- **Production**: Centralized log group in Security Account
- **Retention**: Configurable retention period
- **Encryption**: KMS encryption for log data

## Custom Domain Configuration

### Domain Setup
- **Domain**: `api.{domain_name}` (e.g., `api.tattooartists.co.uk`)
- **Certificate**: ACM certificate from Networking module
- **Security Policy**: TLS 1.2 minimum
- **Endpoint Type**: Regional for better performance

### DNS Configuration
- **Route 53**: Automatic A record creation if hosted zone provided
- **Alias Record**: Points to API Gateway regional endpoint
- **Health Checks**: Optional health check configuration

## Security Considerations

### Authentication Methods
- **Public Endpoints**: No authentication for directory browsing
- **Protected Endpoints**: IAM authentication for administrative functions
- **API Keys**: Optional API key authentication for rate limiting

### Rate Limiting Strategy
- **Per-IP Limits**: Prevent individual IP abuse
- **Global Limits**: Protect backend resources from overload
- **Burst Handling**: Allow temporary traffic spikes

### Input Validation
- **Request Validation**: API Gateway validates request format
- **Lambda Validation**: Additional validation in Lambda functions
- **Error Handling**: Structured error responses

## Performance Optimization

### Caching Strategy
- **CloudFront Integration**: API responses cached at edge locations
- **Cache Headers**: Appropriate cache-control headers set
- **Cache Invalidation**: Automated cache invalidation on data updates

### Response Optimization
- **Compression**: Automatic response compression
- **Pagination**: Large result sets paginated for performance
- **Field Selection**: Optional field filtering to reduce response size

## Operational Benefits
- **Managed Service**: AWS handles API Gateway infrastructure
- **Auto-Scaling**: Scales automatically with request volume
- **Monitoring**: Built-in CloudWatch metrics and logging
- **Security**: Built-in DDoS protection and throttling

## Cost Implications
- **Request Charges**: Per-request pricing for API calls
- **Data Transfer**: Charges for response data transfer
- **Custom Domain**: Additional charges for custom domain usage
- **CloudWatch Logs**: Charges for access log storage

## Monitoring and Alerting
- **Request Metrics**: Count, latency, error rates
- **Integration Metrics**: Lambda integration performance
- **Custom Metrics**: Business-specific API usage metrics
- **Alarms**: Automated alerts for API health issues

## Development Workflow
- **Auto-Deploy**: Development stage auto-deploys on changes
- **Controlled Deploy**: Production requires explicit deployment
- **Testing**: Built-in test console for API endpoint testing
- **Documentation**: Automatic OpenAPI specification generation