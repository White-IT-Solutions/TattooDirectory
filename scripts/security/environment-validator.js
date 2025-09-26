#!/usr/bin/env node

/**
 * Environment Variable Validation and Security
 * Prevents production conflicts and validates local environment configuration
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentValidator {
    constructor() {
        this.requiredLocalVars = [
            'NODE_ENV',
            'AWS_ENDPOINT_URL',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'DYNAMODB_TABLE_NAME'
        ];
        
        this.forbiddenProductionVars = [
            'AWS_PROFILE',
            'AWS_SESSION_TOKEN',
            'PROD_DATABASE_URL',
            'PRODUCTION_API_KEY',
            'STRIPE_LIVE_KEY',
            'SENDGRID_API_KEY'
        ];
        
        this.sensitivePatterns = [
            /sk_live_[a-zA-Z0-9]+/,  // Stripe live keys
            /pk_live_[a-zA-Z0-9]+/,  // Stripe live public keys
            /AKIA[0-9A-Z]{16}/,      // AWS Access Key ID
            /[0-9a-zA-Z/+]{40}/,     // AWS Secret Access Key pattern
            /xoxb-[0-9]+-[0-9]+-[0-9]+-[a-z0-9]+/,  // Slack bot tokens
            /ghp_[a-zA-Z0-9]{36}/,   // GitHub personal access tokens
            /gho_[a-zA-Z0-9]{36}/,   // GitHub OAuth tokens
        ];
        
        this.localOnlyValues = [
            'test',
            'localhost',
            'localstack',
            'development',
            'local'
        ];
    }

    /**
     * Validate all environment configurations
     */
    validateEnvironment() {
        console.log('🔍 Validating environment configuration...');
        
        const results = {
            valid: true,
            errors: [],
            warnings: [],
            securityIssues: []
        };

        try {
            // Validate environment files
            this.validateEnvironmentFiles(results);
            
            // Check for production conflicts
            this.checkProductionConflicts(results);
            
            // Validate sensitive data handling
            this.validateSensitiveData(results);
            
            // Check local-only configurations
            this.validateLocalConfiguration(results);
            
            // Generate security hash for environment
            this.generateEnvironmentHash(results);
            
            this.reportResults(results);
            return results.valid;
            
        } catch (error) {
            console.error('❌ Environment validation failed:', error.message);
            return false;
        }
    }

    /**
     * Validate environment files
     */
    validateEnvironmentFiles(results) {
        const envFiles = [
            '.env.local',
            'devtools/.env.local',
            'devtools/.env.debug.example',
            'frontend/.env.local',
            'frontend/.env.docker.local'
        ];

        for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
                this.validateSingleEnvFile(envFile, results);
            }
        }
    }

    /**
     * Validate a single environment file
     */
    validateSingleEnvFile(filePath, results) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNumber = i + 1;
                
                if (line && !line.startsWith('#')) {
                    this.validateEnvironmentLine(filePath, lineNumber, line, results);
                }
            }
        } catch (error) {
            results.errors.push(`Failed to read ${filePath}: ${error.message}`);
            results.valid = false;
        }
    }

    /**
     * Validate a single environment variable line
     */
    validateEnvironmentLine(filePath, lineNumber, line, results) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        
        if (!key || value === undefined) {
            results.warnings.push(`${filePath}:${lineNumber} - Invalid format: ${line}`);
            return;
        }

        // Check for forbidden production variables
        if (this.forbiddenProductionVars.includes(key)) {
            results.securityIssues.push(`${filePath}:${lineNumber} - Production variable detected: ${key}`);
            results.valid = false;
        }

        // Check for sensitive patterns
        for (const pattern of this.sensitivePatterns) {
            if (pattern.test(value)) {
                results.securityIssues.push(`${filePath}:${lineNumber} - Sensitive data pattern detected in ${key}`);
                results.valid = false;
            }
        }

        // Validate required local variables
        if (this.requiredLocalVars.includes(key)) {
            if (!value || value.trim() === '') {
                results.errors.push(`${filePath}:${lineNumber} - Required variable ${key} is empty`);
                results.valid = false;
            }
        }
    }

    /**
     * Check for production conflicts
     */
    checkProductionConflicts(results) {
        const nodeEnv = process.env.NODE_ENV;
        const awsEndpoint = process.env.AWS_ENDPOINT_URL;
        
        // Ensure we're in development mode
        if (nodeEnv === 'production') {
            results.securityIssues.push('NODE_ENV is set to production in local environment');
            results.valid = false;
        }

        // Ensure we're using LocalStack
        if (awsEndpoint && !awsEndpoint.includes('localstack') && !awsEndpoint.includes('localhost')) {
            results.securityIssues.push('AWS_ENDPOINT_URL points to non-local endpoint');
            results.valid = false;
        }

        // Check for production AWS credentials
        const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
        if (awsAccessKey && awsAccessKey !== 'test' && awsAccessKey.startsWith('AKIA')) {
            results.securityIssues.push('Real AWS credentials detected in local environment');
            results.valid = false;
        }
    }

    /**
     * Validate sensitive data handling
     */
    validateSensitiveData(results) {
        // Check for .env files in version control
        if (fs.existsSync('.gitignore')) {
            const gitignore = fs.readFileSync('.gitignore', 'utf8');
            
            if (!gitignore.includes('.env.local')) {
                results.warnings.push('.env.local should be in .gitignore');
            }
            
            if (!gitignore.includes('.env.production')) {
                results.warnings.push('.env.production should be in .gitignore');
            }
        }

        // Check for sensitive files in the repository
        const sensitiveFiles = [
            '.env.production',
            '.env.staging',
            'aws-credentials.json',
            'service-account.json',
            'private-key.pem'
        ];

        for (const file of sensitiveFiles) {
            if (fs.existsSync(file)) {
                results.securityIssues.push(`Sensitive file detected in repository: ${file}`);
                results.valid = false;
            }
        }
    }

    /**
     * Validate local-only configuration
     */
    validateLocalConfiguration(results) {
        const localVars = {
            'AWS_ENDPOINT_URL': process.env.AWS_ENDPOINT_URL,
            'DYNAMODB_TABLE_NAME': process.env.DYNAMODB_TABLE_NAME,
            'NODE_ENV': process.env.NODE_ENV
        };

        for (const [key, value] of Object.entries(localVars)) {
            if (value) {
                const isLocalValue = this.localOnlyValues.some(localVal => 
                    value.toLowerCase().includes(localVal)
                );
                
                if (!isLocalValue && key !== 'NODE_ENV') {
                    results.warnings.push(`${key} may not be configured for local development: ${value}`);
                }
            }
        }
    }

    /**
     * Generate environment hash for integrity checking
     */
    generateEnvironmentHash(results) {
        const envData = {
            NODE_ENV: process.env.NODE_ENV,
            AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
            DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
            timestamp: new Date().toISOString()
        };

        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(envData))
            .digest('hex');

        results.environmentHash = hash;
        
        // Store hash for comparison
        const hashFile = path.join(process.cwd(), 'logs', 'security', 'env-hash.json');
        const hashDir = path.dirname(hashFile);
        
        if (!fs.existsSync(hashDir)) {
            fs.mkdirSync(hashDir, { recursive: true });
        }
        
        fs.writeFileSync(hashFile, JSON.stringify({
            hash,
            timestamp: new Date().toISOString(),
            environment: envData
        }, null, 2));
    }

    /**
     * Report validation results
     */
    reportResults(results) {
        console.log('\n📊 Environment Validation Results:');
        console.log('=====================================');
        
        if (results.valid) {
            console.log('✅ Environment validation passed');
        } else {
            console.log('❌ Environment validation failed');
        }
        
        if (results.errors.length > 0) {
            console.log('\n🚨 Errors:');
            results.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (results.securityIssues.length > 0) {
            console.log('\n🔒 Security Issues:');
            results.securityIssues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        if (results.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            results.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        console.log(`\n🔐 Environment Hash: ${results.environmentHash}`);
        console.log('=====================================\n');
    }

    /**
     * Create secure environment template
     */
    createSecureTemplate() {
        const template = `# Secure Local Environment Template
# Generated on ${new Date().toISOString()}

# SECURITY NOTICE: This file contains local development settings only
# Never commit production credentials to version control

# Local Development Configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# LocalStack Configuration (Local AWS Services)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=eu-west-2

# Local Database Configuration
DYNAMODB_TABLE_NAME=tattoo-directory-local
OPENSEARCH_ENDPOINT=http://localhost:4566

# Port Configuration (Customize to avoid conflicts)
FRONTEND_PORT=3000
BACKEND_PORT=9000
SWAGGER_PORT=8080
LOCALSTACK_PORT=4566

# Debug Configuration (Optional)
ENABLE_BACKEND_DEBUG=false
ENABLE_FRONTEND_DEBUG=false
LOG_LEVEL=info

# Security Settings (Local Development Only)
DISABLE_SSL_VERIFICATION=true
ALLOW_INSECURE_CONNECTIONS=true

# DO NOT SET THESE IN LOCAL ENVIRONMENT:
# AWS_PROFILE=
# AWS_SESSION_TOKEN=
# PROD_DATABASE_URL=
# PRODUCTION_API_KEY=
# STRIPE_LIVE_KEY=
# SENDGRID_API_KEY=
`;

        fs.writeFileSync('.env.local.template', template);
        console.log('✅ Secure environment template created: .env.local.template');
    }

    /**
     * Sanitize environment for logging
     */
    sanitizeEnvironment() {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(process.env)) {
            if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')) {
                sanitized[key] = '[REDACTED]';
            } else if (key.includes('TOKEN') || key.includes('CREDENTIAL')) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
}

// CLI interface
if (require.main === module) {
    const validator = new EnvironmentValidator();
    const command = process.argv[2];

    switch (command) {
        case 'validate':
            process.exit(validator.validateEnvironment() ? 0 : 1);
            break;
        case 'template':
            validator.createSecureTemplate();
            break;
        case 'sanitize':
            console.log(JSON.stringify(validator.sanitizeEnvironment(), null, 2));
            break;
        default:
            console.log('Usage: node environment-validator.js [validate|template|sanitize]');
            process.exit(1);
    }
}

module.exports = EnvironmentValidator;
