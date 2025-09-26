# macOS Setup Guide - Local Development Environment

## Overview

This guide provides macOS-specific instructions for setting up the Tattoo Artist Directory MVP local development environment using Docker Desktop.

## Prerequisites

### System Requirements

- **macOS 10.15 (Catalina) or later**
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space** for Docker images and containers
- **Intel or Apple Silicon (M1/M2) processor**

### Required Software Installation

#### 1. Install Homebrew (Recommended Package Manager)

Open **Terminal** and install Homebrew:

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH (for Apple Silicon Macs)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Verify installation
brew --version
```

#### 2. Install Docker Desktop

**Option A: Direct Download (Recommended)**
1. Download Docker Desktop from [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
2. Choose the appropriate version:
   - **Intel Chip**: Docker Desktop for Mac with Intel chip
   - **Apple Chip (M1/M2)**: Docker Desktop for Mac with Apple chip
3. Drag Docker.app to Applications folder
4. Launch Docker Desktop from Applications
5. Follow the setup wizard

**Option B: Using Homebrew**
```bash
# Install Docker Desktop via Homebrew Cask
brew install --cask docker

# Launch Docker Desktop
open -a Docker
```

**Configure Docker Desktop:**

1. Open Docker Desktop
2. Go to **Preferences** → **Resources**
3. Allocate resources:
   - **Memory**: 8GB minimum (12GB recommended)
   - **CPUs**: 4 cores minimum
   - **Disk image size**: 64GB minimum
4. Go to **Preferences** → **General**
5. Enable "Use Docker Compose V2"

#### 3. Install Node.js

**Option A: Using Homebrew (Recommended)**
```bash
# Install Node.js LTS
brew install node

# Verify installation
node --version
npm --version
```

**Option B: Using Node Version Manager (nvm)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source profile
source ~/.zshrc

# Install and use Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node --version
npm --version
```

**Option C: Direct Download**
1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer package
3. Verify installation in Terminal

#### 4. Install Git

**Option A: Using Homebrew (Recommended)**
```bash
# Install Git
brew install git

# Verify installation
git --version
```

**Option B: Xcode Command Line Tools**
```bash
# Install Xcode Command Line Tools (includes Git)
xcode-select --install

# Verify installation
git --version
```

#### 5. Install Additional Development Tools (Optional)

```bash
# Install useful development tools
brew install curl wget jq

# Install VS Code (recommended editor)
brew install --cask visual-studio-code

# Install iTerm2 (enhanced terminal)
brew install --cask iterm2
```

## Project Setup

### 1. Clone Repository

Open **Terminal**:

```bash
# Navigate to your development directory
cd ~/Development
# or
mkdir -p ~/Development && cd ~/Development

# Clone the repository
git clone <repository-url>
cd tattoo-artist-directory

# Verify project structure
ls -la
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration

```bash
# Copy environment templates
cp devtools/.env.local.example .env.local
cp frontend/.env.local.example frontend/.env.local
```

Edit the environment files using your preferred text editor:

**`.env.local`:**
```bash
NODE_ENV=development
AWS_REGION=eu-west-2
LOCALSTACK_ENDPOINT=http://localhost:4566
DYNAMODB_TABLE_NAME=tattoo-directory-local
OPENSEARCH_ENDPOINT=http://localhost:4566
API_BASE_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:9000/2015-03-31/functions/function/invocations
NEXT_PUBLIC_ENVIRONMENT=development
```

## Starting the Development Environment

### Method 1: Using NPM Scripts (Recommended)

```bash
# Start all services
npm run local:start

# Wait for services to start (about 2-3 minutes)
# Check service health
npm run local:health
```

### Method 2: Using Docker Compose Directly

```bash
# Start services in detached mode
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Stop services
docker-compose -f docker-compose.local.yml down
```

### Method 3: Using Shell Scripts

```bash
# Make scripts executable (if needed)
chmod +x scripts/start-local.sh
chmod +x scripts/stop-local.sh

# Start environment
./scripts/start-local.sh

# Stop environment
./scripts/stop-local.sh
```

## Verification and Testing

### 1. Check Service Status

```bash
# Check Docker containers
docker ps

# Check service health
curl http://localhost:4566/_localstack/health
curl http://localhost:3000
curl http://localhost:8080
curl http://localhost:9000
```

### 2. Access Services

Open your web browser and navigate to:

- **Frontend Application**: http://localhost:3000
- **API Documentation**: http://localhost:8080
- **LocalStack Dashboard**: http://localhost:4566

### 3. Run Tests

```bash
# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## macOS-Specific Considerations

### Apple Silicon (M1/M2) Compatibility

**Docker Images:**
Some Docker images may not have native ARM64 support. The project handles this automatically, but you may see warnings about platform compatibility.

```bash
# Force x86_64 platform if needed
docker pull --platform linux/amd64 localstack/localstack:3.0

# Check image architecture
docker image inspect localstack/localstack:3.0 | grep Architecture
```

**Performance:**
- Apple Silicon Macs generally have better Docker performance than Intel Macs
- Native ARM64 images start faster and use less resources
- Rosetta 2 translation for x86_64 images may add slight overhead

### File System Considerations

**Case Sensitivity:**
macOS file system is case-insensitive by default, but Docker containers use case-sensitive file systems.

```bash
# Check file system case sensitivity
diskutil info / | grep "File System Personality"

# Be consistent with file naming in your code
```

**File Permissions:**
Docker volume mounts preserve file permissions from the host system.

```bash
# Fix file permissions if needed
chmod -R 755 ./scripts
chmod +x ./scripts/*.sh

# Check current permissions
ls -la scripts/
```

### Network Configuration

**Localhost Access:**
All services are accessible via `localhost` on macOS without additional configuration.

**Port Conflicts:**
Check for conflicting services that might use the same ports:

```bash
# Check what's using specific ports
lsof -i :3000
lsof -i :4566
lsof -i :8080
lsof -i :9000

# Kill processes if needed (replace PID with actual process ID)
kill -9 PID
```

## Troubleshooting macOS-Specific Issues

### Issue: Docker Desktop Won't Start

**Symptoms:**
- Docker Desktop shows "Docker Desktop is starting..." indefinitely
- Error: "Docker Desktop failed to start"

**Solutions:**

1. **Reset Docker Desktop:**
```bash
# Quit Docker Desktop completely
pkill -f Docker

# Remove Docker Desktop data (will reset all settings)
rm -rf ~/Library/Group\ Containers/group.com.docker
rm -rf ~/Library/Containers/com.docker.docker

# Restart Docker Desktop
open -a Docker
```

2. **Check system resources:**
```bash
# Check available memory
vm_stat

# Check disk space
df -h

# Check CPU usage
top -l 1 | grep "CPU usage"
```

3. **Update Docker Desktop:**
   - Check for updates in Docker Desktop menu
   - Download latest version from Docker website

### Issue: Permission Denied Errors

**Symptoms:**
- Cannot execute shell scripts
- Permission denied when accessing files in containers

**Solutions:**

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Fix project permissions
sudo chown -R $(whoami) ./tattoo-artist-directory

# Check and fix Docker socket permissions
ls -la /var/run/docker.sock
sudo chmod 666 /var/run/docker.sock
```

### Issue: Port Already in Use

**Symptoms:**
- Services fail to start with "port already in use" errors
- Cannot access services on expected ports

**Solutions:**

```bash
# Find processes using ports
sudo lsof -i :3000
sudo lsof -i :4566
sudo lsof -i :8080
sudo lsof -i :9000

# Kill specific processes
sudo kill -9 <PID>

# Or kill all processes on a port
sudo pkill -f "port 3000"

# Check for common conflicting services
sudo launchctl list | grep -E "(apache|nginx|postgres)"

# Stop conflicting services
sudo launchctl unload /System/Library/LaunchDaemons/org.apache.httpd.plist
```

### Issue: Slow Performance

**Symptoms:**
- Containers take long time to start
- Application responds slowly
- High CPU usage

**Solutions:**

1. **Optimize Docker Desktop settings:**
   - Increase allocated RAM and CPU cores
   - Enable "Use Docker Compose V2"
   - Disable unnecessary Docker Desktop features

2. **Use native ARM64 images** (for Apple Silicon):
```bash
# Check if ARM64 version is available
docker manifest inspect localstack/localstack:3.0

# Pull ARM64 version specifically
docker pull --platform linux/arm64 localstack/localstack:3.0
```

3. **Clean up Docker resources:**
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

### Issue: File Watching Problems

**Symptoms:**
- Hot reload not working in development
- File changes not detected

**Solutions:**

```bash
# Increase file watcher limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# For macOS, check if polling is needed
# Edit docker-compose.local.yml and add:
# environment:
#   - CHOKIDAR_USEPOLLING=true
```

## Development Workflow on macOS

### Using VS Code (Recommended)

1. **Install VS Code:**
```bash
brew install --cask visual-studio-code
```

2. **Install recommended extensions:**
   - Docker
   - Remote - Containers
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint

3. **Open project:**
```bash
# Open project in VS Code
code .

# Or open specific files
code README-Local-Development.md
```

### Using Terminal Applications

**Built-in Terminal:**
- Basic functionality
- Sufficient for most development tasks

**iTerm2 (Recommended):**
```bash
# Install iTerm2
brew install --cask iterm2

# Features:
# - Split panes
# - Better search
# - Customizable themes
# - Better performance
```

**Terminal Configuration:**
```bash
# Add useful aliases to ~/.zshrc or ~/.bash_profile
echo 'alias ll="ls -la"' >> ~/.zshrc
echo 'alias dc="docker-compose"' >> ~/.zshrc
echo 'alias dcl="docker-compose -f docker-compose.local.yml"' >> ~/.zshrc

# Reload shell configuration
source ~/.zshrc
```

### File Management

**Finder Integration:**
- Right-click folders → "New Terminal at Folder"
- Drag folders to Terminal to get path

**Command Line Tools:**
```bash
# Open current directory in Finder
open .

# Open specific file with default application
open README.md

# Open file with specific application
open -a "Visual Studio Code" .
```

## Performance Optimization

### Docker Desktop Optimization

1. **Resource allocation:**
   - **Intel Macs**: 8GB RAM, 4 CPUs minimum
   - **Apple Silicon**: 12GB RAM, 6 CPUs recommended
   - **Disk**: Use SSD, allocate 64GB+ for Docker

2. **Enable performance features:**
   - Use Docker Compose V2
   - Enable VirtioFS (for better file sharing performance)
   - Use gRPC FUSE for file sharing

### System Optimization

1. **Close unnecessary applications** during development
2. **Use Activity Monitor** to identify resource-heavy processes
3. **Keep macOS updated** for latest performance improvements
4. **Use SSD storage** for project files

### Homebrew Maintenance

```bash
# Update Homebrew and packages
brew update && brew upgrade

# Clean up old versions
brew cleanup

# Check for issues
brew doctor
```

## Next Steps

1. **Verify installation** by accessing all services
2. **Run the test suite** to ensure everything works
3. **Explore the API** using Swagger UI
4. **Start developing** with hot-reload capabilities

## Additional Resources

- [Docker Desktop for Mac Documentation](https://docs.docker.com/desktop/mac/)
- [Homebrew Documentation](https://docs.brew.sh/)
- [Node.js on macOS](https://nodejs.org/en/download/package-manager/#macos)
- [macOS Terminal User Guide](https://support.apple.com/guide/terminal/welcome/mac)

## Support

For macOS-specific issues:

1. Check [macOS Troubleshooting](TROUBLESHOOTING_GUIDE.md#macos-specific-issues)
2. Verify Docker Desktop is properly configured
3. Ensure all prerequisites are installed correctly
4. Check system resources and available disk space
5. Consider Apple Silicon vs Intel compatibility issues
