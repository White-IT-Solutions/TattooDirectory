#!/usr/bin/env node

/**
 * Startup optimization script for local development environment
 * Implements various strategies to reduce container startup times
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class StartupOptimizer {
    constructor() {
        this.optimizations = {
            parallelStartup: true,
            layerCaching: true,
            volumePreallocation: true,
            dependencyOptimization: true,
            healthCheckOptimization: true
        };
        
        this.serviceGroups = {
            // Services that can start in parallel
            infrastructure: ['localstack'],
            backend: ['backend'],
            frontend: ['frontend', 'swagger-ui'],
            utilities: ['data-seeder']
        };
    }

    /**
     * Optimize Docker Compose configuration for faster startup
     */
    async optimizeDockerCompose() {
        console.log('🚀 Optimizing Docker Compose configuration...');
        
        const composeFile = 'devtools/docker/docker-compose.local.yml';
        const backupFile = `${composeFile}.backup`;
        
        // Create backup
        if (fs.existsSync(composeFile)) {
            fs.copyFileSync(composeFile, backupFile);
            console.log(`📋 Backup created: ${backupFile}`);
        }

        // Read current compose file
        let composeContent = fs.readFileSync(composeFile, 'utf8');
        
        // Apply optimizations
        composeContent = this.optimizeHealthChecks(composeContent);
        composeContent = this.optimizeVolumes(composeContent);
        composeContent = this.optimizeDependencies(composeContent);
        composeContent = this.optimizeResourceLimits(composeContent);
        
        // Write optimized file
        fs.writeFileSync(composeFile, composeContent);
        console.log('✅ Docker Compose configuration optimized');
        
        return composeFile;
    }

    /**
     * Optimize health checks for faster readiness detection
     */
    optimizeHealthChecks(content) {
        console.log('  🔍 Optimizing health checks...');
        
        // Reduce health check intervals and timeouts
        const healthCheckOptimizations = {
            'interval: 30s': 'interval: 5s',
            'timeout: 10s': 'timeout: 3s',
            'retries: 5': 'retries: 3',
            'start_period: 30s': 'start_period: 10s'
        };
        
        Object.entries(healthCheckOptimizations).forEach(([old, optimized]) => {
            content = content.replace(new RegExp(old, 'g'), optimized);
        });
        
        return content;
    }

    /**
     * Optimize volume configurations
     */
    optimizeVolumes(content) {
        console.log('  💾 Optimizing volume configurations...');
        
        // Add volume optimizations for better performance
        const volumeOptimizations = [
            '# Volume optimizations for faster I/O',
            'x-volume-opts: &volume-opts',
            '  type: bind',
            '  bind:',
            '    propagation: cached'
        ].join('\n');
        
        // Insert volume optimizations at the top
        if (!content.includes('x-volume-opts')) {
            content = content.replace('version:', `${volumeOptimizations}\n\nversion:`);
        }
        
        return content;
    }

    /**
     * Optimize service dependencies for parallel startup
     */
    optimizeDependencies(content) {
        console.log('  🔗 Optimizing service dependencies...');
        
        // Remove unnecessary dependencies that can start in parallel
        const unnecessaryDeps = [
            'depends_on:\n      - swagger-ui',
            'depends_on:\n        - swagger-ui'
        ];
        
        unnecessaryDeps.forEach(dep => {
            content = content.replace(dep, '# Removed unnecessary dependency for parallel startup');
        });
        
        return content;
    }

    /**
     * Optimize resource limits for development
     */
    optimizeResourceLimits(content) {
        console.log('  ⚡ Optimizing resource limits...');
        
        // Add development-optimized resource limits
        const resourceOptimizations = `
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'`;
        
        // Apply to services that don't have resource limits
        const services = ['backend', 'frontend', 'swagger-ui'];
        services.forEach(service => {
            const servicePattern = new RegExp(`(${service}:.*?)(\\n  \\w+:|\\nvolumes:|$)`, 's');
            const match = content.match(servicePattern);
            if (match && !match[1].includes('deploy:')) {
                content = content.replace(
                    match[1], 
                    match[1] + resourceOptimizations
                );
            }
        });
        
        return content;
    }

    /**
     * Pre-pull Docker images to avoid download time during startup
     */
    async prePullImages() {
        console.log('📥 Pre-pulling Docker images...');
        
        const images = [
            'localstack/localstack:3.0',
            'swaggerapi/swagger-ui:latest',
            'node:20-alpine',
            'public.ecr.aws/lambda/nodejs:20'
        ];
        
        const pullPromises = images.map(image => this.pullImage(image));
        const results = await Promise.allSettled(pullPromises);
        
        results.forEach((result, index) => {
            const image = images[index];
            if (result.status === 'fulfilled') {
                console.log(`  ✅ ${image}`);
            } else {
                console.log(`  ❌ ${image}: ${result.reason}`);
            }
        });
    }

    /**
     * Pull individual Docker image
     */
    async pullImage(image) {
        return new Promise((resolve, reject) => {
            const process = spawn('docker', ['pull', image], { stdio: 'pipe' });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Failed to pull ${image}`));
                }
            });
            
            process.on('error', reject);
        });
    }

    /**
     * Optimize Docker build context and layers
     */
    async optimizeBuildContext() {
        console.log('🏗️  Optimizing Docker build contexts...');
        
        // Create optimized .dockerignore files
        const dockerignoreOptimizations = {
            'backend/.dockerignore': [
                'node_modules',
                'coverage',
                '*.log',
                '.git',
                '.env*',
                'README.md',
                'backend/src/scripts/test-requests.http'
            ],
            'frontend/.dockerignore': [
                'node_modules',
                '.next',
                'coverage',
                '*.log',
                '.git',
                '.env*',
                'README*.md'
            ],
            'scripts/.dockerignore': [
                'node_modules',
                '*.log',
                '.git',
                'README.md'
            ]
        };
        
        Object.entries(dockerignoreOptimizations).forEach(([file, patterns]) => {
            const content = patterns.join('\n') + '\n';
            fs.writeFileSync(file, content);
            console.log(`  📝 Created ${file}`);
        });
    }

    /**
     * Create optimized startup script with parallel execution
     */
    async createOptimizedStartupScript() {
        console.log('📜 Creating optimized startup script...');
        
        const scriptContent = `#!/bin/bash

# Optimized startup script for local development environment
# Implements parallel startup and dependency management

set -e

echo "🚀 Starting Tattoo Directory Local Environment (Optimized)"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "\${RED}❌ Docker is not running. Please start Docker Desktop.\${NC}"
        exit 1
    fi
    echo -e "\${GREEN}✅ Docker is running\${NC}"
}

# Function to check if ports are available
check_ports() {
    local ports=(3000 4566 8080 9000)
    for port in "\${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "\${YELLOW}⚠️  Port $port is already in use\${NC}"
        else
            echo -e "\${GREEN}✅ Port $port is available\${NC}"
        fi
    done
}

# Function to start service group
start_service_group() {
    local group_name=$1
    shift
    local services=("$@")
    
    echo -e "\${BLUE}📦 Starting $group_name services: \${services[*]}\${NC}"
    
    for service in "\${services[@]}"; do
        docker-compose -f devtools/docker/docker-compose.local.yml up -d $service &
    done
    
    wait
    echo -e "\${GREEN}✅ $group_name services started\${NC}"
}

# Function to wait for service health
wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "\${YELLOW}⏳ Waiting for $service to be ready...\${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f $url > /dev/null 2>&1; then
            echo -e "\${GREEN}✅ $service is ready\${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo -e "\${RED}❌ $service failed to start within timeout\${NC}"
    return 1
}

# Main startup sequence
main() {
    echo -e "\${BLUE}🔍 Pre-flight checks...\${NC}"
    check_docker
    check_ports
    
    # Pre-pull images in background
    echo -e "\${BLUE}📥 Pre-pulling images...\${NC}"
    node scripts/startup-optimizer.js --pull-images &
    
    # Start infrastructure services first
    start_service_group "Infrastructure" localstack
    wait_for_service "LocalStack" "http://localhost:4566/_localstack/health"
    
    # Start backend and frontend in parallel
    start_service_group "Application" backend frontend swagger-ui
    
    # Wait for core services
    wait_for_service "Backend" "http://localhost:9000" &
    wait_for_service "Frontend" "http://localhost:3000" &
    wait_for_service "Swagger UI" "http://localhost:8080" &
    wait
    
    # Seed data
    echo -e "\${BLUE}🌱 Seeding test data...\${NC}"
    docker-compose -f devtools/docker/docker-compose.local.yml run --rm data-seeder
    
    # Run performance check
    echo -e "\${BLUE}📊 Running performance check...\${NC}"
    node scripts/performance-monitor.js --startup
    
    echo -e "\${GREEN}✅ Local environment is ready!\${NC}"
    echo -e "\${BLUE}🌐 Frontend: http://localhost:3000\${NC}"
    echo -e "\${BLUE}📚 API Docs: http://localhost:8080\${NC}"
    echo -e "\${BLUE}🔧 Backend API: http://localhost:9000\${NC}"
    echo -e "\${BLUE}☁️  LocalStack: http://localhost:4566\${NC}"
}

# Handle script arguments
case "$1" in
    --pull-images)
        node scripts/startup-optimizer.js --pull-images
        ;;
    --optimize)
        node scripts/startup-optimizer.js --optimize
        ;;
    *)
        main
        ;;
esac`;

        fs.writeFileSync('scripts/start-local-optimized.sh', scriptContent);
        execSync('chmod +x scripts/start-local-optimized.sh');
        console.log('✅ Optimized startup script created: scripts/start-local-optimized.sh');
    }

    /**
     * Create Windows batch version of optimized startup
     */
    async createOptimizedStartupBatch() {
        const batchContent = `@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Tattoo Directory Local Environment (Optimized)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    exit /b 1
)
echo ✅ Docker is running

REM Pre-pull images
echo 📥 Pre-pulling images...
start /b node scripts/startup-optimizer.js --pull-images

REM Start infrastructure services
echo 📦 Starting Infrastructure services...
docker-compose -f devtools/docker/docker-compose.local.yml up -d localstack

REM Wait for LocalStack
echo ⏳ Waiting for LocalStack...
:wait_localstack
timeout /t 2 >nul
curl -f http://localhost:4566/_localstack/health >nul 2>&1
if errorlevel 1 goto wait_localstack
echo ✅ LocalStack is ready

REM Start application services
echo 📦 Starting Application services...
docker-compose -f devtools/docker/docker-compose.local.yml up -d backend frontend swagger-ui

REM Wait for services
echo ⏳ Waiting for services...
timeout /t 10 >nul

REM Seed data
echo 🌱 Seeding test data...
docker-compose -f devtools/docker/docker-compose.local.yml run --rm data-seeder

REM Performance check
echo 📊 Running performance check...
node scripts/performance-monitor.js --startup

echo ✅ Local environment is ready!
echo 🌐 Frontend: http://localhost:3000
echo 📚 API Docs: http://localhost:8080
echo 🔧 Backend API: http://localhost:9000
echo ☁️ LocalStack: http://localhost:4566`;

        fs.writeFileSync('scripts/start-local-optimized.bat', batchContent);
        console.log('✅ Optimized startup batch created: scripts/start-local-optimized.bat');
    }

    /**
     * Run all optimizations
     */
    async optimize() {
        console.log('🔧 Running startup optimizations...');
        
        try {
            await this.optimizeDockerCompose();
            await this.optimizeBuildContext();
            await this.createOptimizedStartupScript();
            await this.createOptimizedStartupBatch();
            
            console.log('\n✅ All optimizations completed!');
            console.log('📋 Summary of optimizations:');
            console.log('  - Optimized Docker Compose health checks');
            console.log('  - Configured volume caching');
            console.log('  - Reduced service dependencies');
            console.log('  - Added resource limits');
            console.log('  - Created .dockerignore files');
            console.log('  - Generated optimized startup scripts');
            
            console.log('\n🚀 Use the optimized startup script:');
            console.log('  Linux/macOS: ./scripts/start-local-optimized.sh');
            console.log('  Windows: scripts\\start-local-optimized.bat');
            
        } catch (error) {
            console.error('❌ Optimization failed:', error.message);
            throw error;
        }
    }

    /**
     * Benchmark startup times
     */
    async benchmarkStartup() {
        console.log('⏱️  Benchmarking startup times...');
        
        const runs = 3;
        const results = [];
        
        for (let i = 1; i <= runs; i++) {
            console.log(`\n🏃 Run ${i}/${runs}`);
            
            // Stop any running containers
            try {
                execSync('docker-compose -f devtools/docker/docker-compose.local.yml down', { stdio: 'pipe' });
            } catch (error) {
                // Ignore errors if nothing is running
            }
            
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Start timing
            const startTime = Date.now();
            
            try {
                // Start services
                execSync('docker-compose -f devtools/docker/docker-compose.local.yml up -d', { stdio: 'pipe' });
                
                // Wait for all services to be ready
                const PerformanceMonitor = require('./performance-monitor.js');
                const monitor = new PerformanceMonitor();
                const startupTimes = await monitor.monitorStartupTimes();
                
                const totalTime = (Date.now() - startTime) / 1000;
                results.push({
                    run: i,
                    totalTime,
                    serviceDetails: startupTimes
                });
                
                console.log(`  ✅ Run ${i} completed in ${totalTime.toFixed(2)}s`);
                
            } catch (error) {
                console.log(`  ❌ Run ${i} failed: ${error.message}`);
                results.push({
                    run: i,
                    error: error.message
                });
            }
        }
        
        // Calculate statistics
        const successfulRuns = results.filter(r => !r.error);
        if (successfulRuns.length > 0) {
            const times = successfulRuns.map(r => r.totalTime);
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            
            console.log('\n📊 Benchmark Results:');
            console.log(`  Average startup time: ${avgTime.toFixed(2)}s`);
            console.log(`  Fastest startup: ${minTime.toFixed(2)}s`);
            console.log(`  Slowest startup: ${maxTime.toFixed(2)}s`);
            console.log(`  Successful runs: ${successfulRuns.length}/${runs}`);
        }
        
        return results;
    }
}

// CLI interface
if (require.main === module) {
    const optimizer = new StartupOptimizer();
    const args = process.argv.slice(2);
    
    if (args.includes('--optimize') || args.includes('-o')) {
        optimizer.optimize().catch(console.error);
    } else if (args.includes('--pull-images')) {
        optimizer.prePullImages().catch(console.error);
    } else if (args.includes('--benchmark') || args.includes('-b')) {
        optimizer.benchmarkStartup().catch(console.error);
    } else {
        console.log('Startup Optimizer');
        console.log('Usage:');
        console.log('  --optimize, -o     Run all optimizations');
        console.log('  --pull-images      Pre-pull Docker images');
        console.log('  --benchmark, -b    Benchmark startup times');
    }
}

module.exports = StartupOptimizer;
