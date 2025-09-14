# Windows Setup Guide - Local Development Environment

## Overview

This guide provides Windows-specific instructions for setting up the Tattoo Artist Directory MVP local development environment using Docker Desktop and WSL2.

## Prerequisites

### System Requirements

- **Windows 10 version 2004 and higher (Build 19041 and higher)** or **Windows 11**
- **WSL 2** (Windows Subsystem for Linux 2)
- **Hyper-V** enabled (for Docker Desktop)
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space** for Docker images and containers

### Required Software Installation

#### 1. Enable WSL 2

Open **PowerShell as Administrator** and run:

```powershell
# Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart your computer
Restart-Computer
```

After restart, set WSL 2 as default:

```powershell
# Set WSL 2 as default version
wsl --set-default-version 2

# Install Ubuntu (recommended distribution)
wsl --install -d Ubuntu

# Verify WSL 2 installation
wsl --list --verbose
```

#### 2. Install Docker Desktop

1. Download Docker Desktop from [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
2. Run the installer with default settings
3. Ensure "Use WSL 2 instead of Hyper-V" is selected during installation
4. Restart your computer when prompted

**Configure Docker Desktop:**

1. Open Docker Desktop
2. Go to **Settings** → **General**
3. Ensure "Use the WSL 2 based engine" is checked
4. Go to **Settings** → **Resources** → **WSL Integration**
5. Enable integration with your WSL 2 distro (Ubuntu)
6. Go to **Settings** → **Resources** → **Advanced**
7. Allocate at least **8GB RAM** and **4 CPUs**

#### 3. Install Node.js

**Option A: Direct Installation**

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer with default settings
3. Verify installation in Command Prompt:

```cmd
node --version
npm --version
```

**Option B: Using Chocolatey (Recommended)**

```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs

# Verify installation
node --version
npm --version
```

#### 4. Install Git

**Option A: Direct Installation**

1. Download Git from [git-scm.com](https://git-scm.com/download/win)
2. Run installer with recommended settings
3. Choose "Git from the command line and also from 3rd-party software"

**Option B: Using Chocolatey**

```powershell
choco install git
```

Verify installation:

```cmd
git --version
```

## Project Setup

### 1. Clone Repository

Open **Command Prompt** or **PowerShell**:

```cmd
# Navigate to your development directory
cd C:\Development

# Clone the repository
git clone <repository-url>
cd tattoo-artist-directory

# Verify project structure
dir
```

### 2. Install Dependencies

```cmd
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

```cmd
# Copy environment templates
copy dev-tools\.env.local.example .env.local
copy frontend\.env.local.example frontend\.env.local
```

**Note**: The project structure has been reorganized. Docker Compose files are now located in `dev-tools\docker\` and API documentation is in `backend\docs\`.

Edit the environment files using your preferred text editor:

**`.env.local`:**

```sh
NODE_ENV=development
AWS_REGION=eu-west-2
LOCALSTACK_ENDPOINT=http://localhost:4566
DYNAMODB_TABLE_NAME=tattoo-directory-local
OPENSEARCH_ENDPOINT=http://localhost:4566
API_BASE_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
```

**`frontend\.env.local`:**

```sh
NEXT_PUBLIC_API_URL=http://localhost:9000/2015-03-31/functions/function/invocations
NEXT_PUBLIC_ENVIRONMENT=development
```

## Starting the Development Environment

### Method 1: Using NPM Scripts (Recommended)

Open **Command Prompt** or **PowerShell** in the project root:

```cmd
# Start all services
npm run local:start

# Wait for services to start (about 2-3 minutes)
# Check service health
npm run local:health
```

### Method 2: Using Docker Compose Directly

```cmd
# Start services in detached mode (basic setup)
docker-compose -f dev-tools\docker\docker-compose.local.yml up -d

# Start with Windows-specific optimizations
docker-compose -f dev-tools\docker\docker-compose.local.yml -f dev-tools\docker\docker-compose.windows.yml up -d

# View logs
docker-compose -f dev-tools\docker\docker-compose.local.yml logs -f

# Stop services
docker-compose -f dev-tools\docker\docker-compose.local.yml down
```

### Method 3: Using Windows Batch Scripts

```cmd
# Start environment
scripts\start-local.bat

# Stop environment
scripts\stop-local.bat
```

## Verification and Testing

### 1. Check Service Status

```cmd
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

```cmd
# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## Windows-Specific Considerations

### File Path Handling

Windows uses backslashes (`\`) for file paths, but Docker expects forward slashes (`/`). The project handles this automatically, but be aware when:

1. **Editing Docker Compose files**: Use forward slashes for volume mounts
2. **Running Docker commands manually**: Use forward slashes or escape backslashes
3. **Setting environment variables**: Use forward slashes for paths

### PowerShell vs Command Prompt

**PowerShell (Recommended):**

- Better Unicode support
- More powerful scripting capabilities
- Better integration with modern development tools

```powershell
# Set execution policy for scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run development commands
npm run local:start
```

**Command Prompt:**

- Traditional Windows command line
- Compatible with all batch scripts
- Simpler for basic operations

```cmd
npm run local:start
```

### Windows Defender and Antivirus

Docker operations may be slowed by real-time scanning. Consider:

1. **Add exclusions** for Docker Desktop directories:

   - `C:\Program Files\Docker`
   - `C:\ProgramData\Docker`
   - Your project directory

2. **Add exclusions** for WSL 2:
   - `C:\Users\%USERNAME%\AppData\Local\Docker`
   - WSL 2 virtual disk locations

### Network Configuration

Windows Firewall may block Docker networking. If you encounter connection issues:

1. **Allow Docker Desktop** through Windows Firewall
2. **Check Windows Defender Firewall** settings
3. **Verify WSL 2 networking** is properly configured

## Troubleshooting Windows-Specific Issues

### Issue: WSL 2 Not Working

**Symptoms:**

- Docker Desktop fails to start
- Error: "WSL 2 installation is incomplete"

**Solutions:**

```powershell
# Update WSL kernel
wsl --update

# Check WSL status
wsl --status

# Restart WSL
wsl --shutdown
# Then restart Docker Desktop
```

### Issue: Hyper-V Conflicts

**Symptoms:**

- Docker Desktop won't start
- VirtualBox or VMware conflicts

**Solutions:**

1. **Disable Hyper-V** temporarily:

```cmd
bcdedit /set hypervisorlaunchtype off
# Restart computer
```

2. **Re-enable Hyper-V**:

```cmd
bcdedit /set hypervisorlaunchtype auto
# Restart computer
```

### Issue: File Permission Errors

**Symptoms:**

- Cannot modify files in containers
- Permission denied errors

**Solutions:**

```cmd
# Run Command Prompt as Administrator
# Or use PowerShell as Administrator

# Check file permissions
icacls "C:\path\to\project"

# Fix permissions if needed
icacls "C:\path\to\project" /grant Users:F /T
```

### Issue: Port Conflicts

**Symptoms:**

- Services fail to start on expected ports
- "Port already in use" errors

**Solutions:**

```cmd
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :4566
netstat -ano | findstr :8080
netstat -ano | findstr :9000

# Kill process by PID (replace XXXX with actual PID)
taskkill /PID XXXX /F

# Or stop common conflicting services
net stop "World Wide Web Publishing Service"  # IIS
net stop "SQL Server Reporting Services"      # SSRS
```

### Issue: Docker Desktop Performance

**Symptoms:**

- Slow container startup
- High CPU/memory usage
- System becomes unresponsive

**Solutions:**

1. **Optimize Docker Desktop settings**:

   - Settings → Resources → Advanced
   - Reduce allocated RAM if system has limited memory
   - Enable "Use Docker Compose V2"

2. **Use WSL 2 backend**:

   - Settings → General → "Use the WSL 2 based engine"

3. **Clean up Docker resources**:

```cmd
docker system prune -a
docker volume prune
```

## Development Workflow on Windows

### Using VS Code (Recommended)

1. **Install VS Code** from [code.visualstudio.com](https://code.visualstudio.com/)

2. **Install recommended extensions**:

   - Docker
   - Remote - WSL
   - Remote - Containers
   - ES7+ React/Redux/React-Native snippets

3. **Open project in WSL**:

```cmd
# From WSL terminal
code .

# Or from Windows
wsl code /path/to/project
```

### Using Windows Terminal (Recommended)

1. **Install Windows Terminal** from Microsoft Store

2. **Configure profiles** for different environments:

   - PowerShell
   - Command Prompt
   - WSL 2 (Ubuntu)

3. **Set up development profile**:

```json
{
  "name": "Development",
  "commandline": "powershell.exe -NoExit -Command \"cd C:\\Development\\tattoo-artist-directory\"",
  "startingDirectory": "C:\\Development\\tattoo-artist-directory"
}
```

### File Editing

**Recommended editors:**

- **VS Code**: Best integration with Docker and WSL
- **WebStorm**: Excellent for Node.js development
- **Notepad++**: Lightweight for quick edits

**Avoid:**

- Windows Notepad (encoding issues)
- Editors that don't handle Unix line endings

## Performance Optimization

### Docker Desktop Optimization

1. **Resource allocation**:

   - RAM: 8GB minimum, 12GB recommended
   - CPU: 4 cores minimum
   - Disk: Use SSD for Docker data

2. **Enable features**:
   - Use Docker Compose V2
   - Enable BuildKit for faster builds
   - Use WSL 2 backend

### System Optimization

1. **Disable unnecessary startup programs**
2. **Keep Windows updated**
3. **Use SSD for project files**
4. **Close resource-intensive applications** during development

## Next Steps

1. **Verify installation** by accessing all services
2. **Run the test suite** to ensure everything works
3. **Explore the API** using Swagger UI
4. **Start developing** with hot-reload capabilities

## Additional Resources

- [Docker Desktop for Windows Documentation](https://docs.docker.com/desktop/windows/)
- [WSL 2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Node.js on Windows](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows)
- [Windows Terminal Documentation](https://docs.microsoft.com/en-us/windows/terminal/)

## Support

For Windows-specific issues:

1. Check [Windows Troubleshooting](TROUBLESHOOTING_GUIDE.md#windows-specific-issues)
2. Verify WSL 2 and Docker Desktop are properly configured
3. Ensure all prerequisites are installed correctly
4. Check Windows Defender and firewall settings
