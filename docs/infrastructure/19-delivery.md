# Delivery Module (19-delivery)

## Overview
The Delivery module creates the CloudFront distribution that serves as the primary entry point for the tattoo artist directory application. It provides global content delivery, security headers, origin failover, and integrates with the API Gateway for a unified user experience.

## Purpose
- Provides global content delivery network (CDN) for optimal performance
- Implements security headers and DDoS protection
- Enables origin failover between primary and backup S3 buckets
- Integrates frontend static content with backend API through unified domain

## Resources Created

### CloudFront Distribution
- **aws_cloudfront_distribution.frontend**: Main CDN distribution with multiple origins
- **aws_cloudfront_origin_access_control.frontend**: Secure access control for S3 origins
- **aws_cloudfront_response_headers_policy.security_headers**: Security headers policy

### Origin Configuration
- **S3 Origins**: Primary and backup S3 buckets for frontend content
- **Origin Group**: Automatic failover between S3 buckets
- **API Gateway Origin**: Backend API integration for `/v1/*` paths

### Cache Behaviors
- **Default Behavior**: Static content caching for frontend assets
- **API Behavior**: Pass-through caching for API endpoints
- **Error Handling**: SPA-friendly error responses

## Key Features

### Global Performance
- **Edge Locations**: Content cached at 400+ global edge locations
- **Compression**: Automatic GZIP compression for text content
- **HTTP/2**: Modern protocol support for improved performance
- **IPv6**: Full IPv6 support for modern networks

### High Availability
- **Origin Failover**: Automatic failover between primary and backup S3 buckets
- **Health Checks**: Monitors origin health and routes traffic accordingly
- **Multi-Region**: Origins can be in different regions for disaster recovery

### Security Features
- **WAF Integration**: Web Application Firewall protection
- **Security Headers**: HSTS, CSP, X-Frame-Options, and other security headers
- **HTTPS Enforcement**: Redirects all HTTP traffic to HTTPS
- **Geographic Restrictions**: Configurable country-based access control

### SPA Support
- **Custom Error Pages**: 404 and 403 errors redirect to index.html
- **Client-Side Routing**: Supports React Router and other SPA frameworks
- **Cache Invalidation**: Efficient cache invalidation for deployments

## Origin Configuration

### S3 Origins (Frontend Content)
- **Primary Origin**: Main frontend S3 bucket
- **Backup Origin**: Backup frontend S3 bucket in different region
- **Access Control**: Origin Access Control (OAC) for secure access
- **Failover Criteria**: 403, 404, 500, 502, 503, 504 status codes

### API Gateway Origin
- **Path Pattern**: `/v1/*` routes to API Gateway
- **Protocol**: HTTPS only with TLS 1.2+
- **Origin Path**: Environment-specific path (e.g., `/dev`, `/prod`)
- **Custom Headers**: Forwarded to API for processing

## Cache Behavior Configuration

### Default Behavior (Static Content)
- **Target Origin**: S3 origin group with failover
- **Allowed Methods**: GET, HEAD, OPTIONS
- **Cached Methods**: GET, HEAD
- **Cache Policy**: Managed-CachingOptimized
- **Compression**: Enabled for all content types
- **Viewer Protocol**: Redirect HTTP to HTTPS

### API Behavior (`/v1/*`)
- **Target Origin**: API Gateway
- **Allowed Methods**: All HTTP methods (GET, POST, PUT, DELETE, etc.)
- **Cache Policy**: Managed-CachingDisabled (dynamic content)
- **Origin Request Policy**: Managed-AllViewer (forward all headers)
- **Viewer Protocol**: Redirect HTTP to HTTPS

## Security Headers Policy

### Strict Transport Security (HSTS)
- **Max Age**: 31,536,000 seconds (1 year)
- **Include Subdomains**: Enabled
- **Preload**: Enabled for browser preload lists

### Content Security Policy (CSP)
- **Frame Options**: DENY (prevents clickjacking)
- **Content Type Options**: nosniff (prevents MIME sniffing)
- **XSS Protection**: Enabled with block mode

### Additional Headers
- **Referrer Policy**: Strict origin when cross-origin
- **Permissions Policy**: Restrictive permissions for browser APIs

## Custom Domain Configuration

### Domain Setup
- **Primary Domain**: `{domain_name}` (e.g., `tattooartists.co.uk`)
- **WWW Domain**: `www.{domain_name}` (e.g., `www.tattooartists.co.uk`)
- **Certificate**: ACM certificate from us-east-1 (CloudFront requirement)
- **SSL Policy**: TLS 1.2 minimum with SNI support

### DNS Configuration
- **Route 53 Integration**: Automatic A record creation if hosted zone provided
- **Alias Records**: Point to CloudFront distribution
- **Health Checks**: Optional health check configuration

## Geographic Restrictions

### Allowed Countries
- **Whitelist Mode**: Only specified countries can access content
- **Default**: UK and other English-speaking countries
- **Configurable**: Can be modified via `allowed_countries` variable
- **Compliance**: Supports GDPR and other regional requirements

## Access Logging

### Log Configuration
- **Destination**: S3 bucket in Audit Account
- **Prefix**: `cloudfront-access-logs/`
- **Include Cookies**: Disabled for privacy
- **Real-Time**: Near real-time log delivery

### Log Format
- Standard CloudFront access log format
- Includes: timestamp, client IP, request method, URI, status code, bytes sent
- Analysis: Can be analyzed with AWS Athena or other tools

## Dependencies
- **App Storage Module**: Uses frontend S3 buckets as origins
- **API Module**: Integrates with API Gateway for backend requests
- **App Security Module**: Uses WAF Web ACL for protection
- **Networking Module**: Uses ACM certificate for HTTPS
- **Log Storage Module**: Uses access logs bucket for logging

## Outputs
- **cloudfront_distribution_id**: Distribution ID for cache invalidation
- **cloudfront_domain_name**: CloudFront domain name for DNS configuration
- **cloudfront_hosted_zone_id**: Hosted zone ID for Route 53 alias records
- **distribution_arn**: Distribution ARN for monitoring and management

## Integration with Other Modules

### App Storage Module
- Uses frontend S3 buckets as primary and backup origins
- Origin Access Control secures S3 bucket access

### API Module
- Routes `/v1/*` requests to API Gateway
- Provides unified domain for frontend and backend

### App Security Module
- WAF Web ACL protects against common web attacks
- Rate limiting and threat protection at edge locations

### App Monitoring Module
- CloudWatch metrics monitor distribution performance
- Alarms track error rates and cache hit ratios

## Performance Optimization

### Caching Strategy
- **Static Assets**: Long-term caching (1 year) with versioned filenames
- **HTML Files**: Short-term caching (5 minutes) for quick updates
- **API Responses**: No caching for dynamic content
- **Cache Invalidation**: Automated invalidation on deployments

### Compression
- **GZIP**: Automatic compression for text-based content
- **Brotli**: Modern compression algorithm support
- **Image Optimization**: WebP format support for modern browsers

### Edge Computing
- **Lambda@Edge**: Optional edge computing for advanced features
- **CloudFront Functions**: Lightweight functions for simple transformations
- **Real-Time**: Sub-millisecond execution at edge locations

## Security Considerations

### DDoS Protection
- **AWS Shield Standard**: Automatic DDoS protection included
- **AWS Shield Advanced**: Optional enhanced DDoS protection
- **Rate Limiting**: WAF provides application-layer rate limiting

### Content Security
- **Origin Access Control**: Prevents direct S3 bucket access
- **Signed URLs**: Optional signed URL support for private content
- **Field-Level Encryption**: Optional encryption for sensitive form data

### Access Control
- **Geographic Restrictions**: Country-based access control
- **IP Whitelisting**: Optional IP-based access control via WAF
- **Authentication**: Integration with Cognito or other auth providers

## Operational Benefits
- **Global Reach**: Content delivered from nearest edge location
- **High Availability**: Multiple origins with automatic failover
- **Scalability**: Handles traffic spikes automatically
- **Cost Efficiency**: Reduces origin server load and bandwidth costs

### Monitoring and Analytics
- **Real-Time Metrics**: Request count, error rates, cache hit ratio
- **Geographic Analytics**: Traffic patterns by country and region
- **Performance Metrics**: Origin latency and response times
- **Security Analytics**: WAF blocked requests and attack patterns

## Cost Implications
- **Data Transfer**: Primary cost based on data transfer volume
- **Requests**: Per-request charges for HTTP/HTTPS requests
- **Regional Pricing**: Different pricing tiers by geographic region
- **Optional Features**: Additional charges for Lambda@Edge, field-level encryption

### Cost Optimization
- **Price Class**: Use PriceClass_100 for development (US/Europe only)
- **Cache Optimization**: Maximize cache hit ratio to reduce origin requests
- **Compression**: Reduce data transfer costs with compression
- **Regional Distribution**: Consider traffic patterns when selecting price class

## Deployment and Management
- **Blue/Green Deployments**: Support for zero-downtime deployments
- **Cache Invalidation**: Automated invalidation on content updates
- **Configuration Management**: Infrastructure as Code with Terraform
- **Rollback Capability**: Quick rollback to previous distribution configuration

## Disaster Recovery
- **Origin Failover**: Automatic failover between S3 buckets
- **Multi-Region**: Origins can be in different AWS regions
- **DNS Failover**: Route 53 health checks for additional failover
- **Backup Strategy**: Multiple origins ensure content availability