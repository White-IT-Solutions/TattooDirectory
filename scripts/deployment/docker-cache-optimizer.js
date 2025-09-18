#!/usr/bin/env node

/**
 * Docker layer caching optimization script
 * Optimizes Dockerfiles and build processes for maximum layer reuse
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DockerCacheOptimizer {
    constructor() {
        this.dockerfiles = [
            'backend/Dockerfile.local',
            'frontend/Dockerfile.local',
            'scripts/Dockerfile.seeder'
        ];
        
        this.buildContexts = [
            'backend',
            'frontend', 
            'scripts'
        ];
    }

    /**
     * Optimize all Dockerfiles for better layer caching
     */
    async optimizeDockerfiles() {
        console.log('🐳 Optimizing Dockerfiles for layer caching...');
        
        for (const dockerfile of this.dockerfiles) {
            if (fs.existsSync(dockerfile)) {
                await this.optimizeDockerfile(dockerfile);
            }
        }
        
        console.log('✅ All Dockerfiles optimized');
    }

    /**
     * Optimize individual Dockerfile
     */
    async optimizeDockerfile(dockerfilePath) {
        console.log(`  📝 Optimizing ${dockerfilePath}...`);
        
        // Create backup
        const backupPath = `${dockerfilePath}.backup`;
        fs.copyFileSync(dockerfilePath, backupPath);
        
        let content = fs.readFileSync(dockerfilePath, 'utf8');
        
        // Apply optimizations based on dockerfile type
        if (dockerfilePath.includes('backend')) {
            content = this.optimizeBackendDockerfile(content);
        } else if (dockerfilePath.includes('frontend')) {
            content = this.optimizeFrontendDockerfile(content);
        } else if (dockerfilePath.includes('seeder')) {
            content = this.optimizeSeederDockerfile(content);
        }
        
        // Write optimized content
        fs.writeFileSync(dockerfilePath, content);
        console.log(`    ✅ ${dockerfilePath} optimized`);
    }

    /**
     * Optimize backend Dockerfile for Lambda RIE
     */
    optimizeBackendDockerfile(content) {
        const optimizedContent = `# Optimized backend Dockerfile for layer caching
FROM public.ecr.aws/lambda/nodejs:20

# Install system dependencies first (rarely changes)
RUN yum update -y && \\
    yum install -y curl && \\
    yum clean all

# Install Lambda Runtime Interface Emulator (rarely changes)
ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/bin/aws-lambda-rie
RUN chmod +x /usr/bin/aws-lambda-rie

# Copy package files first for dependency caching
COPY package*.json \${LAMBDA_TASK_ROOT}/

# Install dependencies (cached if package.json unchanged)
RUN npm ci --only=production && \\
    npm cache clean --force

# Copy source code (changes frequently, so do this last)
COPY src/ \${LAMBDA_TASK_ROOT}/src/

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Set up environment
ENV NODE_ENV=development
ENV AWS_LAMBDA_RUNTIME_API=localhost:9001

# Health check for faster startup detection
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \\
    CMD curl -f http://localhost:8080/2015-03-31/functions/function/invocations || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["src/handlers/api-handler/index.handler"]`;

        return optimizedContent;
    }

    /**
     * Optimize frontend Dockerfile for Next.js
     */
    optimizeFrontendDockerfile(content) {
        const optimizedContent = `# Optimized frontend Dockerfile for layer caching
FROM node:20-alpine

# Install system dependencies (rarely changes)
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Copy package files first for dependency caching
COPY package*.json ./

# Install dependencies (cached if package.json unchanged)
RUN npm ci && \\
    npm cache clean --force

# Copy Next.js configuration files
COPY next.config.* ./
COPY jsconfig.json ./
COPY postcss.config.* ./
COPY tailwind.config.* ./

# Copy source code (changes frequently, so do this last)
COPY src/ ./src/
COPY public/ ./public/

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Health check for faster startup detection
HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \\
    CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "run", "dev"]`;

        return optimizedContent;
    }

    /**
     * Optimize seeder Dockerfile
     */
    optimizeSeederDockerfile(content) {
        const optimizedContent = `# Optimized seeder Dockerfile for layer caching
FROM node:20-alpine

# Install system dependencies (rarely changes)
RUN apk add --no-cache curl aws-cli

# Set working directory
WORKDIR /app

# Copy package files first for dependency caching
COPY package*.json ./

# Install dependencies (cached if package.json unchanged)
RUN npm ci && \\
    npm cache clean --force

# Copy seeder scripts and data (changes less frequently)
COPY data-seeder/ ./data-seeder/
COPY test-data/ ./test-data/

# Copy main seeder script
COPY backend/src/scripts/seed-opensearch.js ./

# Set environment variables
ENV NODE_ENV=development

# Default command
CMD ["node", "seed-opensearch.js"]`;

        return optimizedContent;
    }

    /**
     * Create optimized .dockerignore files
     */
    createOptimizedDockerignore() {
        console.log('📋 Creating optimized .dockerignore files...');
        
        const dockerignoreConfigs = {
            'backend/.dockerignore': [
                '# Node.js',
                'node_modules/',
                'npm-debug.log*',
                'yarn-debug.log*',
                'yarn-error.log*',
                '',
                '# Coverage and testing',
                'coverage/',
                '*.test.js',
                '__tests__/',
                '',
                '# Development files',
                '.env*',
                '!.env.example',
                'README*.md',
                'test-requests.http',
                '',
                '# Git and IDE',
                '.git/',
                '.gitignore',
                '.vscode/',
                '.idea/',
                '',
                '# Logs',
                '*.log',
                'logs/',
                '',
                '# Docker',
                'Dockerfile*',
                '.dockerignore',
                'docker-compose*.yml'
            ],
            
            'frontend/.dockerignore': [
                '# Dependencies',
                'node_modules/',
                '',
                '# Next.js build output',
                '.next/',
                'out/',
                '',
                '# Environment variables',
                '.env*',
                '!.env.example',
                '!.env.local.example',
                '',
                '# Testing',
                'coverage/',
                '*.test.js',
                '*.test.ts',
                '*.test.tsx',
                '__tests__/',
                '',
                '# Development files',
                'README*.md',
                '.eslintrc*',
                '',
                '# Git and IDE',
                '.git/',
                '.gitignore',
                '.vscode/',
                '.idea/',
                '',
                '# Logs',
                '*.log',
                'logs/',
                '',
                '# Docker',
                'Dockerfile*',
                '.dockerignore',
                'docker-compose*.yml'
            ],
            
            'scripts/.dockerignore': [
                '# Node.js',
                'node_modules/',
                'npm-debug.log*',
                '',
                '# Development files',
                'README*.md',
                '*.test.js',
                '',
                '# Git and IDE',
                '.git/',
                '.gitignore',
                '.vscode/',
                '',
                '# Logs',
                '*.log',
                '',
                '# Docker',
                'Dockerfile*',
                '.dockerignore',
                'docker-compose*.yml',
                '',
                '# Exclude other service directories',
                '../backend/',
                '../frontend/',
                '../infrastructure/'
            ]
        };
        
        Object.entries(dockerignoreConfigs).forEach(([filePath, patterns]) => {
            const content = patterns.join('\n') + '\n';
            
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, content);
            console.log(`  ✅ Created ${filePath}`);
        });
    }

    /**
     * Create Docker build cache configuration
     */
    createBuildCacheConfig() {
        console.log('🏗️  Creating Docker build cache configuration...');
        
        const buildConfig = {
            version: '1.0',
            caching: {
                enabled: true,
                strategy: 'layer-cache',
                maxAge: '7d',
                maxSize: '2GB'
            },
            services: {
                backend: {
                    context: './backend',
                    dockerfile: 'Dockerfile.local',
                    cacheFrom: [
                        'public.ecr.aws/lambda/nodejs:20',
                        'tattoo-directory-backend:cache'
                    ],
                    buildArgs: {
                        BUILDKIT_INLINE_CACHE: '1'
                    }
                },
                frontend: {
                    context: './frontend',
                    dockerfile: 'Dockerfile.local',
                    cacheFrom: [
                        'node:20-alpine',
                        'tattoo-directory-frontend:cache'
                    ],
                    buildArgs: {
                        BUILDKIT_INLINE_CACHE: '1'
                    }
                },
                'data-seeder': {
                    context: './scripts',
                    dockerfile: 'Dockerfile.seeder',
                    cacheFrom: [
                        'node:20-alpine',
                        'tattoo-directory-seeder:cache'
                    ],
                    buildArgs: {
                        BUILDKIT_INLINE_CACHE: '1'
                    }
                }
            }
        };
        
        fs.writeFileSync('.docker-cache-config.json', JSON.stringify(buildConfig, null, 2));
        console.log('  ✅ Created .docker-cache-config.json');
    }

    /**
     * Create optimized Docker Compose override for caching
     */
    createCacheOptimizedCompose() {
        console.log('📦 Creating cache-optimized Docker Compose override...');
        
        const composeOverride = `# Docker Compose override for build caching optimization
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.local
      cache_from:
        - public.ecr.aws/lambda/nodejs:20
        - tattoo-directory-backend:cache
      args:
        BUILDKIT_INLINE_CACHE: 1
    image: tattoo-directory-backend:latest

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.local
      cache_from:
        - node:20-alpine
        - tattoo-directory-frontend:cache
      args:
        BUILDKIT_INLINE_CACHE: 1
    image: tattoo-directory-frontend:latest

  data-seeder:
    build:
      context: ./scripts
      dockerfile: Dockerfile.seeder
      cache_from:
        - node:20-alpine
        - tattoo-directory-seeder:cache
      args:
        BUILDKIT_INLINE_CACHE: 1
    image: tattoo-directory-seeder:latest

# Enable BuildKit for better caching
x-buildkit: &buildkit
  DOCKER_BUILDKIT: 1
  COMPOSE_DOCKER_CLI_BUILD: 1`;

        fs.writeFileSync('docker-compose.cache.yml', composeOverride);
        console.log('  ✅ Created docker-compose.cache.yml');
    }

    /**
     * Create cache management scripts
     */
    createCacheManagementScripts() {
        console.log('🧹 Creating cache management scripts...');
        
        // Cache cleanup script
        const cleanupScript = `#!/bin/bash

# Docker cache cleanup script
echo "🧹 Cleaning Docker build cache..."

# Remove unused build cache
docker builder prune -f

# Remove dangling images
docker image prune -f

# Remove unused volumes
docker volume prune -f

# Show cache usage
echo "📊 Current Docker cache usage:"
docker system df

echo "✅ Cache cleanup completed"`;

        fs.writeFileSync('scripts/clean-docker-cache.sh', cleanupScript);
        execSync('chmod +x scripts/clean-docker-cache.sh');
        
        // Cache warming script
        const warmupScript = `#!/bin/bash

# Docker cache warming script
echo "🔥 Warming Docker build cache..."

# Build all images with cache
echo "Building backend..."
docker-compose -f docker-compose.local.yml -f docker-compose.cache.yml build backend

echo "Building frontend..."
docker-compose -f docker-compose.local.yml -f docker-compose.cache.yml build frontend

echo "Building data-seeder..."
docker-compose -f docker-compose.local.yml -f docker-compose.cache.yml build data-seeder

# Tag images for cache reuse
docker tag tattoo-directory-backend:latest tattoo-directory-backend:cache
docker tag tattoo-directory-frontend:latest tattoo-directory-frontend:cache
docker tag tattoo-directory-seeder:latest tattoo-directory-seeder:cache

echo "✅ Cache warming completed"`;

        fs.writeFileSync('scripts/warm-docker-cache.sh', warmupScript);
        execSync('chmod +x scripts/warm-docker-cache.sh');
        
        console.log('  ✅ Created cache management scripts');
    }

    /**
     * Analyze current cache efficiency
     */
    async analyzeCacheEfficiency() {
        console.log('📊 Analyzing Docker cache efficiency...');
        
        try {
            // Get build cache usage
            const cacheUsage = execSync('docker system df', { encoding: 'utf8' });
            console.log('\n📦 Current Docker usage:');
            console.log(cacheUsage);
            
            // Get build history for analysis
            const buildHistory = execSync('docker builder ls', { encoding: 'utf8' });
            console.log('\n🏗️  Build cache status:');
            console.log(buildHistory);
            
            // Check for layer reuse opportunities
            const images = execSync('docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}\\t{{.CreatedAt}}"', { encoding: 'utf8' });
            console.log('\n🖼️  Current images:');
            console.log(images);
            
            // Analyze Dockerfile efficiency
            this.analyzeDockerfileEfficiency();
            
        } catch (error) {
            console.error('Error analyzing cache efficiency:', error.message);
        }
    }

    /**
     * Analyze Dockerfile layer efficiency
     */
    analyzeDockerfileEfficiency() {
        console.log('\n🔍 Analyzing Dockerfile layer efficiency...');
        
        this.dockerfiles.forEach(dockerfilePath => {
            if (fs.existsSync(dockerfilePath)) {
                console.log(`\n📝 ${dockerfilePath}:`);
                
                const content = fs.readFileSync(dockerfilePath, 'utf8');
                const lines = content.split('\n');
                
                let layerCount = 0;
                let cacheableInstructions = 0;
                let recommendations = [];
                
                lines.forEach((line, index) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('RUN') || trimmed.startsWith('COPY') || 
                        trimmed.startsWith('ADD') || trimmed.startsWith('FROM')) {
                        layerCount++;
                        
                        if (trimmed.startsWith('COPY package') || trimmed.startsWith('RUN npm')) {
                            cacheableInstructions++;
                        }
                        
                        // Check for optimization opportunities
                        if (trimmed.startsWith('COPY . ') && index < lines.length / 2) {
                            recommendations.push(`Line ${index + 1}: Consider moving 'COPY . .' later for better caching`);
                        }
                    }
                });
                
                console.log(`  Layers: ${layerCount}`);
                console.log(`  Cacheable instructions: ${cacheableInstructions}`);
                console.log(`  Cache efficiency: ${((cacheableInstructions / layerCount) * 100).toFixed(1)}%`);
                
                if (recommendations.length > 0) {
                    console.log('  Recommendations:');
                    recommendations.forEach(rec => console.log(`    - ${rec}`));
                }
            }
        });
    }

    /**
     * Run all cache optimizations
     */
    async optimize() {
        console.log('🚀 Running Docker cache optimizations...');
        
        try {
            await this.optimizeDockerfiles();
            this.createOptimizedDockerignore();
            this.createBuildCacheConfig();
            this.createCacheOptimizedCompose();
            this.createCacheManagementScripts();
            
            console.log('\n✅ Docker cache optimization completed!');
            console.log('📋 Summary of optimizations:');
            console.log('  - Optimized Dockerfiles for layer caching');
            console.log('  - Created .dockerignore files');
            console.log('  - Configured build cache settings');
            console.log('  - Created cache-optimized Docker Compose');
            console.log('  - Added cache management scripts');
            
            console.log('\n🔧 Usage:');
            console.log('  Build with cache: docker-compose -f docker-compose.local.yml -f docker-compose.cache.yml build');
            console.log('  Warm cache: ./scripts/warm-docker-cache.sh');
            console.log('  Clean cache: ./scripts/clean-docker-cache.sh');
            
        } catch (error) {
            console.error('❌ Cache optimization failed:', error.message);
            throw error;
        }
    }
}

// CLI interface
if (require.main === module) {
    const optimizer = new DockerCacheOptimizer();
    const args = process.argv.slice(2);
    
    if (args.includes('--optimize') || args.includes('-o')) {
        optimizer.optimize().catch(console.error);
    } else if (args.includes('--analyze') || args.includes('-a')) {
        optimizer.analyzeCacheEfficiency().catch(console.error);
    } else {
        console.log('Docker Cache Optimizer');
        console.log('Usage:');
        console.log('  --optimize, -o    Run all cache optimizations');
        console.log('  --analyze, -a     Analyze current cache efficiency');
    }
}

module.exports = DockerCacheOptimizer;