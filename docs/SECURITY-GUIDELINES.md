# Local Development Security Guidelines

## Overview

This document outlines comprehensive security measures and best practices for the local development environment of the Tattoo Artist Directory application. These guidelines ensure secure isolation, prevent production conflicts, and maintain data protection standards.

## Table of Contents

1. [Network Security](#network-security)
2. [Container Security](#container-security)
3. [Environment Variable Security](#environment-variable-security)
4. [Access Controls](#access-controls)
5. [Data Protection](#data-protection)
6. [Security Monitoring](#security-monitoring)
7. [Incident Response](#incident-response)

## Network Security

### Docker Network Isolation

The local environment uses an isolated Docker bridge network with the following security configurations:

```yaml
networks:
  tattoo-directory-local:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: tattoo-local-br0
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"
      com.docker.network.bridge.host_binding_ipv4: "127.0.0.1"
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
```

#### Network Security Features:

- **Isolated Subnet**: Uses dedicated 172.20.0.0/16 subnet
- **Host Binding**: All external ports bound to 127.0.0.1 (localhost only)
- **Static IP Assignment**: Each service has a fixed IP address
- **Inter-Container Communication**: Controlled communication between services

#### Service IP Assignments:

| Service | IP Address | External Access |
|---------|------------|-----------------|
| LocalStack | 172.20.0.10 | No |
| Backend | 172.20.0.20 | Yes (localhost only) |
| Frontend | 172.20.0.30 | Yes (localhost only) |
| Swagger UI | 172.20.0.40 | Yes (localhost only) |
| Data Seeder | 172.20.0.50 | No |

### Port Security

All external ports are bound to localhost (127.0.0.1) to prevent external network access:

```yaml
ports:
  - "127.0.0.1:${FRONTEND_PORT:-3000}:3000"
  - "127.0.0.1:${BACKEND_PORT:-9000}:8080"
  - "127.0.0.1:${SWAGGER_PORT:-8080}:80"
  - "127.0.0.1:${LOCALSTACK_PORT:-4566}:4566"
```

#### Default Port Assignments:

- **Frontend**: 3000 (HTTP)
- **Backend**: 9000 (Lambda RIE)
- **Swagger UI**: 8080 (HTTP)
- **LocalStack**: 4566 (AWS Services)
- **Debug Ports**: 9229 (Backend), 9230 (Frontend)

## Container Security

### Security Options

All containers implement the following security measures:

#### Common Security Options:
```yaml
security_opt:
  - no-new-privileges:true
read_only: true  # Where possible
tmpfs:
  - /tmp:noexec,nosuid,size=100m
user: "1000:1000"  # Non-root user
```

#### Container-Specific Security:

**Backend Container:**
- Read-only filesystem
- Non-root user (1000:1000)
- Restricted tmpfs mounts
- No privilege escalation

**Frontend Container:**
- Read-only filesystem
- Non-root user (1000:1000)
- Separate tmpfs for Next.js cache
- Security headers enabled

**LocalStack Container:**
- Limited write access (required for AWS simulation)
- No privilege escalation
- Restricted Docker socket access (read-only)

**Swagger UI Container:**
- Read-only filesystem
- Nginx user (101:101)
- Minimal tmpfs mounts

### Resource Limits

All containers have resource limits to prevent resource exhaustion attacks:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "0.5"
    reservations:
      memory: 256M
      cpus: "0.25"
```

### Volume Security

All volumes are mounted with appropriate security flags:

- **Read-only mounts**: Source code and configuration files
- **Restricted tmpfs**: Temporary directories with noexec, nosuid flags
- **Named volumes**: Persistent data with proper permissions

## Environment Variable Security

### Validation Rules

The environment validator enforces the following security rules:

#### Required Local Variables:
- `NODE_ENV=development`
- `AWS_ENDPOINT_URL=http://localhost:4566` or `http://172.20.0.10:4566`
- `AWS_ACCESS_KEY_ID=test`
- `AWS_SECRET_ACCESS_KEY=test`
- `DYNAMODB_TABLE_NAME=tattoo-directory-local`

#### Forbidden Production Variables:
- `AWS_PROFILE`
- `AWS_SESSION_TOKEN`
- `PROD_DATABASE_URL`
- `PRODUCTION_API_KEY`
- `STRIPE_LIVE_KEY`
- `SENDGRID_API_KEY`

#### Sensitive Pattern Detection:
- Stripe live keys: `sk_live_*`, `pk_live_*`
- AWS credentials: `AKIA*` patterns
- GitHub tokens: `ghp_*`, `gho_*`
- Slack tokens: `xoxb-*`

### Environment File Security

#### Secure Environment Template:
```bash
# .env.local (never commit to version control)
NODE_ENV=development
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
DYNAMODB_TABLE_NAME=tattoo-directory-local

# Security settings
SECURITY_VALIDATION_ENABLED=true
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_ENABLED=true
```

#### .gitignore Requirements:
```
.env.local
.env.production
.env.staging
aws-credentials.json
service-account.json
private-key.pem
```

## Access Controls

### Service Access Matrix

| Service | Internal Access | External Access | Debug Access |
|---------|----------------|-----------------|--------------|
| LocalStack | Backend, Seeder | No | No |
| Backend | Frontend, Swagger | localhost:9000 | localhost:9229 |
| Frontend | None | localhost:3000 | localhost:9230 |
| Swagger UI | None | localhost:8080 | No |
| Data Seeder | LocalStack | No | No |

### Authentication and Authorization

#### Local Development Authentication:
- No authentication required for local services
- CORS restrictions enforced
- Rate limiting enabled on API endpoints
- Input validation on all endpoints

#### API Security Headers:
```javascript
// Security headers for local development
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:*",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## Data Protection

### Sensitive Data Handling

#### Data Classification:
- **Public**: Artist profiles, portfolio images, styles
- **Internal**: System logs, performance metrics
- **Restricted**: Debug information, error details
- **Confidential**: None in local environment

#### Data Sanitization:
```javascript
// Sanitize data before logging
const sanitizeForLogging = (data) => {
  const sensitiveFields = ['email', 'phone', 'password', 'token'];
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};
```

### Test Data Security

#### Test Data Guidelines:
- Use only synthetic/mock data
- No real personal information
- No production data copies
- Consistent test datasets

#### Data Seeding Security:
```javascript
// Secure test data generation
const generateTestArtist = () => ({
  artistId: `test-artist-${uuid()}`,
  artistName: `Test Artist ${randomInt(1, 1000)}`,
  email: `test${randomInt(1, 1000)}@example.com`,
  // ... other test fields
});
```

## Security Monitoring

### Logging and Monitoring

#### Security Event Logging:
- Container startup/shutdown events
- Network connection attempts
- Environment validation failures
- Resource limit violations
- Security policy violations

#### Log Configuration:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service=backend,security.level=high"
```

### Security Scanning

#### Docker Image Scanning:
```bash
# Run security scan
npm run security:scan-images

# Check for vulnerabilities
npm run security:check-vulnerabilities

# Validate environment
npm run security:validate-environment
```

#### Automated Security Checks:
- Daily image vulnerability scans
- Environment validation on startup
- Network configuration validation
- Resource usage monitoring

### Security Metrics

#### Key Security Metrics:
- Failed authentication attempts: 0 (no auth in local)
- Network policy violations: 0
- Resource limit breaches: < 5%
- Environment validation failures: 0
- Container security violations: 0

## Incident Response

### Security Incident Types

#### High Priority:
- Production credentials detected in local environment
- External network access to internal services
- Container privilege escalation
- Sensitive data exposure

#### Medium Priority:
- Resource limit violations
- Network configuration changes
- Environment validation failures
- Unauthorized port exposure

#### Low Priority:
- Log file size violations
- Performance degradation
- Non-critical service failures

### Response Procedures

#### Immediate Actions:
1. **Stop affected services**: `docker-compose down`
2. **Isolate environment**: Disconnect from network if needed
3. **Preserve evidence**: Save logs and configuration
4. **Assess impact**: Determine scope of incident

#### Investigation Steps:
1. **Review logs**: Check all service logs for anomalies
2. **Validate configuration**: Run security validation scripts
3. **Check network**: Verify network isolation
4. **Scan images**: Run vulnerability scans

#### Recovery Actions:
1. **Fix root cause**: Address security vulnerability
2. **Update configuration**: Apply security patches
3. **Restart services**: Bring environment back online
4. **Verify security**: Run full security validation

### Emergency Contacts

#### Internal Team:
- **Development Lead**: [Contact Information]
- **Security Officer**: [Contact Information]
- **DevOps Engineer**: [Contact Information]

#### Escalation Matrix:
1. **Level 1**: Development Team Member
2. **Level 2**: Team Lead
3. **Level 3**: Security Officer
4. **Level 4**: Management

## Security Validation Commands

### Daily Security Checks:
```bash
# Validate environment configuration
npm run security:validate-env

# Scan Docker images
npm run security:scan-images

# Check network configuration
npm run security:check-network

# Validate access controls
npm run security:check-access
```

### Weekly Security Reviews:
```bash
# Generate security report
npm run security:generate-report

# Review security logs
npm run security:review-logs

# Update security configurations
npm run security:update-config
```

### Security Automation:
```bash
# Pre-commit security checks
npm run security:pre-commit

# CI/CD security validation
npm run security:ci-validation

# Automated security monitoring
npm run security:monitor
```

## Compliance and Auditing

### Security Standards Compliance:
- **OWASP Top 10**: Application security best practices
- **Docker Security**: Container security guidelines
- **Network Security**: Isolation and access control standards
- **Data Protection**: Local data handling requirements

### Audit Trail:
- All security events logged
- Configuration changes tracked
- Access attempts recorded
- Security scan results archived

### Regular Security Reviews:
- **Daily**: Automated security checks
- **Weekly**: Manual security review
- **Monthly**: Comprehensive security audit
- **Quarterly**: Security policy updates

---

## Quick Reference

### Security Commands:
```bash
# Start secure environment
npm run local:start:secure

# Validate security configuration
npm run security:validate

# Generate security report
npm run security:report

# Emergency shutdown
npm run local:emergency-stop
```

### Security Contacts:
- **Security Issues**: security@tattoo-directory.local
- **Emergency**: emergency@tattoo-directory.local
- **General Questions**: dev-team@tattoo-directory.local

### Important Files:
- Security Configuration: `dev-tools/docker/docker-compose.local.yml`
- Environment Validation: `scripts/security/environment-validator.js`
- Network Security: `scripts/security/docker-network-security.js`
- Image Scanner: `scripts/security/docker-image-scanner.js`