# Tattoo MVP - Master Setup Guide

## 1. Overview

This guide provides a comprehensive overview of how to set up, run, and manage the Tattoo MVP project for local development. It covers everything from initial setup to daily development workflows and troubleshooting.

The local development environment uses Docker and LocalStack to simulate a cloud environment on your machine, allowing for consistent and reliable development across different platforms.

## 2. Quick Start (for experienced developers)

This section is for developers who are already familiar with Node.js, Docker, and Git.

### Prerequisites

- **Node.js**: v18 or higher
- **Docker Desktop**: Latest stable version
- **Git**: Latest stable version

### Setup and Run

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd Tattoo_MVP
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Set up test data**:

    ```bash
    cd scripts
    npm install
    npm run setup
    cd ..
    ```

4.  **Start the environment**:

    ```bash
    npm run local:start
    ```

5.  **Verify**:
    ```bash
    npm run local:health
    ```

### Access Points

- **Frontend Next.js development server**: http://localhost:3000
- **Swagger UI API documentation interface**: http://localhost:8080
- **LocalStack**: http://localhost:4566
- **LocalStack UI**: http://localhost:4566/\_localstack/cockpit
- **LocalStack AWS services simulation**: http://localhost:4566/\_localstack/health
- **Backend API**: http://localhost:9000
- **Backend API Lambda Runtime Interface Emulator**: http://localhost:9000/2015-03-31/functions/function/invocations

## 3. Detailed Setup Instructions

This section provides detailed, step-by-step instructions for setting up the development environment on Windows, macOS, and Linux.

### Cross-Platform Compatibility

The local environment automatically detects your platform and uses the appropriate configuration:

- **Windows**: Uses cached volume mounts and polling-based file watching
- **macOS**: Uses delegated volume mounts and native fsevents for file watching  
- **Linux**: Uses direct bind mounts for fastest performance

The system automatically uses platform-specific Docker Compose files:
- `docker-compose.windows.yml` - Windows-specific optimizations
- `docker-compose.macos.yml` - macOS-specific optimizations
- `docker-compose.linux.yml` - Linux-specific optimizations

### 3.1. Windows Setup

#### Prerequisites

- **Windows 10 version 2004 and higher (Build 19041 and higher)** or **Windows 11**
- **WSL 2** (Windows Subsystem for Linux 2)
- **Hyper-V** enabled (for Docker Desktop)
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space** for Docker images and containers

#### Installation

1.  **Enable WSL 2**:
    Open PowerShell as an administrator and run:

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

2.  **Install Docker Desktop**:

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

3.  **Install Node.js**:

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

4.  **Install Git**:

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

### 3.2. macOS Setup

#### Prerequisites

- **macOS 10.15 (Catalina) or later**
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space** for Docker images and containers
- **Intel or Apple Silicon (M1/M2) processor**

#### Installation

1.  **Install Homebrew (Recommended Package Manager)**:
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

2.  **Install Docker Desktop**:

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

3.  **Install Node.js**:

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

4.  **Install Git**:

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

5.  **Install Additional Development Tools (Optional)**:

    ```bash
    # Install useful development tools
    brew install curl wget jq
    
    # Install VS Code (recommended editor)
    brew install --cask visual-studio-code
    
    # Install iTerm2 (enhanced terminal)
    brew install --cask iterm2
    ```

### 3.3. Linux Setup

#### Prerequisites

- **Linux distribution**: Ubuntu 20.04+, Debian 10+, CentOS 8+, Fedora 32+, or equivalent
- **Kernel version**: 3.10+ (4.0+ recommended)
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space** for Docker images and containers
- **x86_64 or ARM64 architecture**

#### Supported Distributions

This guide covers the most common Linux distributions:
- **Ubuntu/Debian** (apt package manager)
- **CentOS/RHEL/Fedora** (yum/dnf package manager)
- **Arch Linux** (pacman package manager)
- **openSUSE** (zypper package manager)

#### Installation

1.  **Update System Packages**:

    **Ubuntu/Debian:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

    **CentOS/RHEL/Fedora:**
    ```bash
    # CentOS/RHEL 8+
    sudo dnf update -y
    
    # Older CentOS/RHEL
    sudo yum update -y
    
    # Fedora
    sudo dnf update -y
    ```

    **Arch Linux:**
    ```bash
    sudo pacman -Syu
    ```

    **openSUSE:**
    ```bash
    sudo zypper update
    ```

2.  **Install Docker Engine**:

    **Ubuntu/Debian Installation:**
    ```bash
    # Remove old Docker versions
    sudo apt remove docker docker-engine docker.io containerd runc
    
    # Install prerequisites
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Verify installation
    sudo docker --version
    ```

    **CentOS/RHEL/Fedora Installation:**
    ```bash
    # Remove old Docker versions
    sudo dnf remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
    
    # Install prerequisites
    sudo dnf install -y yum-utils device-mapper-persistent-data lvm2
    
    # Add Docker repository
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    
    # Install Docker Engine
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Verify installation
    sudo docker --version
    ```

    **Arch Linux Installation:**
    ```bash
    # Install Docker
    sudo pacman -S docker docker-compose
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Verify installation
    sudo docker --version
    ```

3.  **Configure Docker for Non-Root User**:

    ```bash
    # Add your user to the docker group
    sudo usermod -aG docker $USER
    
    # Log out and back in, or use newgrp to activate the group
    newgrp docker
    
    # Verify you can run Docker without sudo
    docker --version
    docker ps
    ```

4.  **Install Docker Compose (if not included)**:

    **For older systems without docker-compose-plugin:**
    ```bash
    # Download Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink (optional)
    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    # Verify installation
    docker-compose --version
    ```

5.  **Install Node.js**:

    **Using NodeSource Repository (Recommended):**

    **Ubuntu/Debian:**
    ```bash
    # Install Node.js 18.x LTS
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    ```

    **CentOS/RHEL/Fedora:**
    ```bash
    # Install Node.js 18.x LTS
    curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
    sudo dnf install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    ```

    **Using Node Version Manager (nvm):**
    ```bash
    # Install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Reload shell or source profile
    source ~/.bashrc
    # or
    source ~/.zshrc
    
    # Install and use Node.js LTS
    nvm install --lts
    nvm use --lts
    
    # Verify installation
    node --version
    npm --version
    ```

6.  **Install Git**:

    **Ubuntu/Debian:**
    ```bash
    sudo apt install -y git
    ```

    **CentOS/RHEL/Fedora:**
    ```bash
    sudo dnf install -y git
    ```

    **Arch Linux:**
    ```bash
    sudo pacman -S git
    ```

    **openSUSE:**
    ```bash
    sudo zypper install git
    ```

    Verify installation:
    ```bash
    git --version
    ```

7.  **Install Additional Development Tools**:

    ```bash
    # Ubuntu/Debian
    sudo apt install -y curl wget jq build-essential
    
    # CentOS/RHEL/Fedora
    sudo dnf install -y curl wget jq gcc gcc-c++ make
    
    # Arch Linux
    sudo pacman -S curl wget jq base-devel
    
    # openSUSE
    sudo zypper install curl wget jq gcc gcc-c++ make
    ```

## 4. Project Configuration

Once you have the prerequisites installed, you can configure the project.

### 4.1. Clone and Install

```bash
git clone <repository-url>
cd Tattoo_MVP
npm install
```

### 4.2. Environment Variables

Copy the example environment files:

```bash
cp devtools/.env.local.example .env.local
cp frontend/.env.local.example frontend/.env.local
```

The default values in these files are configured for the local development environment and should not need to be changed.

## 5. Running the Environment

The following commands are run from the root of the project.

- **Start the environment**:

  ```bash
  npm run local:start
  ```

- **Stop the environment**:

  ```bash
  npm run local:stop
  ```

- **Restart the environment**:

  ```bash
  npm run local:restart
  ```

- **View logs**:

  ```bash
  npm run local:logs
  ```

- **Check health status**:
  ```bash
  npm run local:health
  ```

## 6. Development Workflow

### Daily Development Workflow

#### First Time Setup (One Time Only)

1. **Initial setup**:
   ```bash
   # Set up test data with S3 images
   cd scripts
   npm install
   npm run setup
   cd ..
   
   # Start environment
   npm run local:start
   npm run local:health
   ```

#### Daily Development

1. **Start your day**:
   ```bash
   npm run local:start
   npm run local:health
   ```

2. **During development**:
   ```bash
   # Monitor logs
   npm run local:logs
   
   # Test changes
   npm run local:test-api
   ```

3. **End of day**:
   ```bash
   npm run local:stop
   ```

### Frontend Development

- **Hot Reload**: Changes to files in the `frontend/src` directory will trigger automatic hot-reload in your browser
- **Access**: Frontend available at `http://localhost:3000`
- **Development Server**: Next.js development server with fast refresh
- **File Watching**: Automatic detection of file changes

**Frontend Development Commands:**
```bash
# Start frontend only (with mock data)
npm run dev:frontend

# Run frontend tests
npm run test --workspace=frontend

# Build frontend for production
npm run build --workspace=frontend
```

### Backend Development

- **API Changes**: After making changes to files in the `backend/src` directory, restart the backend service:
  ```bash
  docker-compose -f devtools/docker/docker-compose.local.yml restart backend
  ```
- **API Testing**: Test your API changes using the Swagger UI at `http://localhost:8080`
- **Lambda Functions**: Backend runs via Lambda Runtime Interface Emulator

**Backend Development Commands:**
```bash
# Start backend services only
npm run dev:backend

# Test API endpoints
npm run local:test-api

# View backend logs
npm run local:logs:backend
```

### Full-Stack Development

**Complete environment for API and frontend integration:**
```bash
# Complete setup
npm run local:start
npm run setup-data
```

### API Development

**Focus on backend services and API endpoints:**
```bash
# Start LocalStack and backend
npm run dev:backend
npm run setup-data:images-only
```

### Testing Workflows

#### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- --grep "artists"
```

#### End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (with browser UI)
npm run test:e2e:headed
```

#### API Testing

**Using Swagger UI:**
1. Open `http://localhost:8080` in your browser
2. Explore available endpoints in the API documentation
3. Click "Try it out" on any endpoint to test it
4. View request/response examples and schemas

**Using curl:**
```bash
# Get all artists
curl -X GET "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "GET",
    "path": "/v1/artists",
    "queryStringParameters": {"limit": "10"}
  }'
```

### Debugging Workflows

#### Frontend Debugging
1. Open browser developer tools
2. Set breakpoints in your code
3. Use React Developer Tools extension for component inspection

#### Backend Debugging
1. Attach VS Code debugger to the backend container
2. Use the provided launch configuration in `.vscode/launch.json`
3. Set breakpoints in Lambda function code

#### Debugging Sessions
```bash
# Start with clean environment
npm run local:reset

# Re-seed test data if needed
npm run seed

# Enable detailed logging
npm run local:logs --follow

# Test specific functionality
npm run local:test-api
```

### Data Management Workflow

#### Resetting Test Data
```bash
# Clean existing data
npm run seed:clean

# Re-upload images and update data (if images changed)
cd scripts
npm run setup
cd ..

# Re-seed the database
npm run seed
```

#### Custom Test Data
To add custom test data:
1. Edit files in `scripts/test-data/`
2. Restart the data seeder:
   ```bash
   docker-compose -f devtools/docker/docker-compose.local.yml run --rm data-seeder
   ```

### Weekly Maintenance

```bash
# Clean up resources
docker system prune -a

# Update Docker images
docker-compose -f devtools/docker/docker-compose.local.yml pull

# Generate environment report
npm run local:report
```

### Complete Setup from Scratch

**Prerequisites:**
- Node.js 18+
- Docker Desktop (running)
- Git

**Step-by-Step Setup:**

1. **Clone and navigate to project**:
   ```bash
   git clone <repository-url>
   cd Tattoo_MVP
   ```

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Set up test data with images**:
   ```bash
   cd scripts
   npm install
   npm run setup
   cd ..
   ```

4. **Start the local environment**:
   ```bash
   npm run local:start
   ```

5. **Verify everything is working**:
   ```bash
   npm run local:health
   ```

6. **Access the application**:
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:8080
   - LocalStack UI: http://localhost:4566/_localstack/cockpit

## 7. Test Data Setup

The project includes a comprehensive set of test data to provide a realistic development experience.

### Test Data Structure

- **Artists**: 10 sample artists with professional avatars, portfolios, and contact information
- **Studios**: 3 studios with locations and artist associations  
- **Styles**: 17 tattoo style categories with descriptions and associated images
- **Images**: Over 127 realistic tattoo images organized by style

### S3 Image Upload System

The local environment uses LocalStack to emulate AWS S3. The test data setup includes:

**Image Management:**
- `scripts/upload-images-to-s3.js` - Uploads images to LocalStack S3
- `scripts/update-test-data.js` - Updates test data with S3 URLs
- `scripts/setup-test-data.js` - Main orchestrator script
- Cross-platform scripts: `setup-test-data.sh` (Linux/macOS) and `setup-test-data.bat` (Windows)

**How LocalStack S3 Works:**
1. **Bucket Creation**: Creates `tattoo-directory-images` bucket
2. **Image Upload**: Uploads images with structure: `styles/{styleId}/{filename}`
3. **URL Generation**: Creates URLs like: `http://localhost:4566/tattoo-directory-images/styles/{styleId}/{filename}`
4. **Public Access**: Images are uploaded with `public-read` ACL for easy access

### Initial Data Setup (First Time Only)

**Complete Setup (Recommended):**
```bash
cd scripts
npm install
npm run setup
cd ..
```

**Step by Step:**
```bash
cd scripts
npm install
npm run upload-images  # Upload to S3
npm run update-data     # Update test data files
cd ..
```

**Platform-Specific Scripts:**
```bash
# Linux/macOS
./scripts/setup-test-data.sh

# Windows
scripts\setup-test-data.bat
```

### What Gets Set Up

- **LocalStack S3**: 127 test images across 17 tattoo styles
- **DynamoDB**: Artist, studio, and style data
- **OpenSearch**: Searchable artist index
- **Frontend**: Next.js application with realistic data
- **Backend**: Lambda functions with API Gateway

### Updated Style System

**17 Comprehensive Styles:**
- `watercolour`, `tribal`, `traditional`, `surrealism`, `sketch`
- `realism`, `psychedelic`, `old_school`, `new_school`, `neo_traditional`
- `minimalism`, `lettering`, `geometric`, `floral`, `fineline`
- `blackwork`, `dotwork`

**Artist Updates:**
- New style IDs matching the updated style definitions
- Faker.js avatar URLs: `https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-{id}.jpg`
- Portfolio images ready for S3 URL replacement
- Cleaned up style references

### Resetting Data

To reset the database to its initial state:

```bash
# Clean existing data
npm run seed:clean

# Re-upload images and update data (if images changed)
cd scripts
npm run setup
cd ..

# Re-seed the database
npm run seed
```

### Data Management Commands

**Root Level:**
- `npm run seed` - Seed test data to LocalStack
- `npm run seed:clean` - Clean existing seeded data
- `npm run seed:validate` - Validate test data files

**Scripts Directory:**
- `npm run setup` - Complete test data setup with S3 images
- `npm run upload-images` - Upload images to LocalStack S3
- `npm run update-data` - Update test data with S3 URLs

## 8. Troubleshooting

### Common Issues

#### Docker Issues

**Issue: Docker containers fail to start**
```bash
# Solution: Check Docker Desktop is running and has sufficient resources
docker info
docker system prune  # Clean up unused resources
```

**Issue: "Docker daemon is not running"**
- **Windows/macOS**: Make sure Docker Desktop is running
- **Linux**: Start Docker service: `sudo systemctl start docker`

**Issue: Permission errors**
- **Linux**: Ensure your user is in the `docker` group: `sudo usermod -aG docker $USER`
- **Windows**: Try running your terminal as an administrator
- **macOS**: Check Docker Desktop has proper permissions

#### Port Conflicts

**Check what's using ports:**
- **Windows**: `netstat -ano | findstr :<port>`
- **macOS/Linux**: `lsof -i :<port>`

**Common conflicting services:**
```bash
# Stop conflicting services
# Windows
net stop "World Wide Web Publishing Service"  # IIS
net stop "SQL Server Reporting Services"      # SSRS

# macOS
sudo launchctl unload /System/Library/LaunchDaemons/org.apache.httpd.plist

# Linux
sudo systemctl stop apache2
sudo systemctl stop nginx
```

#### LocalStack Issues

**Issue: LocalStack services not responding**
```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Reset LocalStack data
npm run local:reset

# Check logs for errors
npm run local:logs:localstack
```

**Issue: AWS SDK connection errors**
```bash
# Verify environment variables are set correctly
echo $AWS_ENDPOINT_URL
# Should output: http://localhost:4566
```

#### Application Issues

**Issue: Frontend can't connect to backend**
```bash
# Verify backend is running and accessible
curl http://localhost:9000
# Check frontend environment variables in frontend/.env.local
```

**Issue: No test data visible**
```bash
# Re-setup test data
cd scripts
npm run setup
cd ..

# Re-seed database
npm run seed
```

**Issue: Services not responding**
- Check the service logs for errors: `npm run local:logs`
- Run the health checks: `npm run local:health`
- Try restarting the environment: `npm run local:restart`

#### Performance Issues

**Issue: Slow startup**
- Ensure Docker has sufficient resources allocated
- Close unnecessary applications
- Use SSD storage for Docker data

**Issue: High memory usage**
```bash
# Check resource usage
docker stats

# Adjust Docker memory limits in docker-compose files
```

**Issue: Out of disk space**
```bash
# Clean up Docker resources
docker system prune -a
docker volume prune

# Check disk usage
docker system df
```

### Platform-Specific Troubleshooting

#### Windows-Specific Issues

**Issue: WSL 2 Not Working**
```powershell
# Update WSL kernel
wsl --update

# Check WSL status
wsl --status

# Restart WSL
wsl --shutdown
# Then restart Docker Desktop
```

**Issue: Hyper-V Conflicts**
```cmd
# Disable Hyper-V temporarily
bcdedit /set hypervisorlaunchtype off
# Restart computer

# Re-enable Hyper-V
bcdedit /set hypervisorlaunchtype auto
# Restart computer
```

**Issue: File Permission Errors**
```cmd
# Run Command Prompt as Administrator
# Check file permissions
icacls "C:\path\to\project"

# Fix permissions if needed
icacls "C:\path\to\project" /grant Users:F /T
```

#### macOS-Specific Issues

**Issue: Docker Desktop Won't Start**
```bash
# Reset Docker Desktop
pkill -f Docker
rm -rf ~/Library/Group\ Containers/group.com.docker
rm -rf ~/Library/Containers/com.docker.docker
open -a Docker
```

**Issue: File Watching Problems**
```bash
# Increase file watcher limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# For macOS, check if polling is needed in docker-compose files
# environment:
#   - CHOKIDAR_USEPOLLING=true
```

**Issue: Apple Silicon (M1/M2) Compatibility**
```bash
# Force x86_64 platform if needed
docker pull --platform linux/amd64 localstack/localstack:3.0

# Check image architecture
docker image inspect localstack/localstack:3.0 | grep Architecture
```

#### Linux-Specific Issues

**Issue: Permission Denied for Docker Socket**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify group membership
groups $USER

# If still having issues, check socket permissions
ls -la /var/run/docker.sock
sudo chmod 666 /var/run/docker.sock
```

**Issue: Docker Service Not Starting**
```bash
# Check Docker service status
sudo systemctl status docker

# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check Docker daemon logs
sudo journalctl -u docker.service
```

**Issue: SELinux Considerations (CentOS/RHEL/Fedora)**
```bash
# Check SELinux status
sestatus

# If SELinux is enforcing, configure for Docker
sudo setsebool -P container_manage_cgroup on

# Or temporarily set to permissive mode for development
sudo setenforce 0
```

**Issue: Firewall Configuration**
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 3000/tcp
sudo ufw allow 4566/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 9000/tcp

# CentOS/RHEL/Fedora (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=4566/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --reload
```

## 9. Advanced Configuration

### Port Configuration

The default ports for the services can be configured via environment variables in the `.env.local` file:

- `FRONTEND_PORT` (default: 3000)
- `BACKEND_PORT` (default: 9000)
- `SWAGGER_PORT` (default: 8080)
- `LOCALSTACK_PORT` (default: 4566)

The system will also detect port conflicts and report them on startup.

### Resource Management

The resource limits for each service can be configured in the `docker-compose.override.yml` file. The default limits are:

- **LocalStack**: 1.5GB RAM, 1 CPU
- **Backend**: 512MB RAM, 0.5 CPU
- **Frontend**: 1GB RAM, 0.5 CPU
- **Swagger UI**: 64MB RAM, 0.1 CPU
- **Data Seeder**: 256MB RAM, 0.25 CPU

## 10. Platform-Specific Optimizations

The local development environment is optimized for each platform using a combination of Docker Compose override files and environment variables.

### Docker Compose Overrides

The system automatically uses platform-specific Docker Compose files to optimize performance:

- **`docker-compose.windows.yml`**: Uses cached volume mounts and polling-based file watching.
- **`docker-compose.macos.yml`**: Uses delegated volume mounts and native `fsevents` for file watching.
- **`docker-compose.linux.yml`**: Uses direct bind mounts for the fastest performance.

### File Watching

File watching is automatically configured based on your platform:

- **Windows**: Uses polling (`WATCHPACK_POLLING=true`).
- **macOS/Linux**: Uses native file events.

## 11. Scripts Reference

### Environment Management

| Script          | Description                      | Usage                   |
| --------------- | -------------------------------- | ----------------------- |
| `local:start`   | Start complete local environment | `npm run local:start`   |
| `local:stop`    | Stop all services                | `npm run local:stop`    |
| `local:restart` | Restart environment              | `npm run local:restart` |
| `local:status`  | Show container status            | `npm run local:status`  |
| `local:health`  | Run health checks                | `npm run local:health`  |
| `local:clean`   | Stop and remove all data         | `npm run local:clean`   |
| `local:reset`   | Clean and restart                | `npm run local:reset`   |

### Logging and Monitoring

| Script                  | Description             | Usage                           |
| ----------------------- | ----------------------- | ------------------------------- |
| `local:logs`            | View all service logs   | `npm run local:logs`            |
| `local:logs:backend`    | View backend logs only  | `npm run local:logs:backend`    |
| `local:logs:frontend`   | View frontend logs only | `npm run local:logs:frontend`   |
| `local:logs:localstack` | View LocalStack logs    | `npm run local:logs:localstack` |

### Development Utilities

| Script           | Description                 | Usage                    |
| ---------------- | --------------------------- | ------------------------ |
| `local:test-api` | Test API endpoints          | `npm run local:test-api` |
| `local:reset`    | Reset LocalStack data       | `npm run local:reset`    |
| `local:cleanup`  | Clean Docker resources      | `npm run local:cleanup`  |

### Data Management

| Script          | Description                  | Usage                   |
| --------------- | ---------------------------- | ----------------------- |
| `seed`          | Seed test data to LocalStack | `npm run seed`          |
| `seed:clean`    | Clean existing seeded data   | `npm run seed:clean`    |
| `seed:validate` | Validate test data files     | `npm run seed:validate` |

### Test Data Setup (Scripts Directory)

| Script          | Description                             | Usage                                 |
| --------------- | --------------------------------------- | ------------------------------------- |
| `setup`         | Complete test data setup with S3 images | `cd scripts && npm run setup`         |
| `upload-images` | Upload images to LocalStack S3          | `cd scripts && npm run upload-images` |
| `update-data`   | Update test data with S3 URLs           | `cd scripts && npm run update-data`   |

### Cross-Platform Commands

```bash
# Start environment (auto-detects platform)
npm run local:start

# Stop environment
npm run local:stop

# View logs
npm run local:logs

# Check service health
npm run local:health

# Get platform information
npm run local:platform-info

# Clean restart (removes all data)
npm run local:clean
npm run local:start
```

### Platform-Specific Commands

If you need to run platform-specific scripts directly:

```bash
# Windows
npm run local:start:windows
npm run local:stop:windows

# Unix (macOS/Linux)
npm run local:start:unix
npm run local:stop:unix
```

### Individual Script Usage

#### Health Check
```bash
# Basic health check
npm run local:health

# Quiet mode (minimal output)
node scripts/health-check.js --quiet

# JSON output
node scripts/health-check.js --json
```

#### Development Utilities
```bash
# Check environment status
node scripts/dev-utils.js status

# Test API endpoints
node scripts/dev-utils.js test

# Show resource usage
node scripts/dev-utils.js resources

# Show all URLs
node scripts/dev-utils.js urls

# Reset LocalStack data
node scripts/dev-utils.js reset

# Clean Docker resources
node scripts/dev-utils.js cleanup
```
