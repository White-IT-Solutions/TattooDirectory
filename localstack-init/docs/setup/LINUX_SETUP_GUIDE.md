# Linux Setup Guide - Local Development Environment

## Overview

This guide provides Linux-specific instructions for setting up the Tattoo Artist Directory MVP local development environment using Docker Engine and Docker Compose.

## Prerequisites

### System Requirements

- **Linux distribution**: Ubuntu 20.04+, Debian 10+, CentOS 8+, Fedora 32+, or equivalent
- **Kernel version**: 3.10+ (4.0+ recommended)
- **8GB RAM minimum** (16GB recommended)
- **10GB free disk space** for Docker images and containers
- **x86_64 or ARM64 architecture**

### Supported Distributions

This guide covers the most common Linux distributions:
- **Ubuntu/Debian** (apt package manager)
- **CentOS/RHEL/Fedora** (yum/dnf package manager)
- **Arch Linux** (pacman package manager)
- **openSUSE** (zypper package manager)

## Required Software Installation

### 1. Update System Packages

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

### 2. Install Docker Engine

#### Ubuntu/Debian Installation

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

#### CentOS/RHEL/Fedora Installation

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

#### Arch Linux Installation

```bash
# Install Docker
sudo pacman -S docker docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
sudo docker --version
```

#### openSUSE Installation

```bash
# Install Docker
sudo zypper install docker docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
sudo docker --version
```

### 3. Configure Docker for Non-Root User

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in, or use newgrp to activate the group
newgrp docker

# Verify you can run Docker without sudo
docker --version
docker ps
```

### 4. Install Docker Compose (if not included)

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

### 5. Install Node.js

#### Using NodeSource Repository (Recommended)

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

#### Using Package Manager

**Ubuntu/Debian:**
```bash
sudo apt install -y nodejs npm
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
```

**openSUSE:**
```bash
sudo zypper install nodejs18 npm18
```

#### Using Node Version Manager (nvm)

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

### 6. Install Git

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

### 7. Install Additional Development Tools

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

## Project Setup

### 1. Clone Repository

```bash
# Navigate to your development directory
cd ~/Development
# or create it
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
cp dev-tools/.env.local.example .env.local
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
# Make scripts executable
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

## Linux-Specific Considerations

### File Permissions and Ownership

Linux file permissions are strictly enforced in Docker containers:

```bash
# Check current user and group
id

# Fix ownership of project files
sudo chown -R $USER:$USER ~/Development/tattoo-artist-directory

# Make scripts executable
chmod +x scripts/*.sh

# Check file permissions
ls -la scripts/
```

### SELinux Considerations (CentOS/RHEL/Fedora)

If SELinux is enabled, you may need to configure it for Docker:

```bash
# Check SELinux status
sestatus

# If SELinux is enforcing, you may need to:
# 1. Set appropriate SELinux contexts for Docker
sudo setsebool -P container_manage_cgroup on

# 2. Or temporarily set to permissive mode for development
sudo setenforce 0

# 3. Configure Docker volumes with proper SELinux labels
# Add :Z flag to volume mounts in dev-tools/docker/docker-compose.local.yml if needed
```

### Firewall Configuration

Configure firewall to allow Docker networking:

**Ubuntu/Debian (ufw):**
```bash
# Check firewall status
sudo ufw status

# Allow Docker ports if needed
sudo ufw allow 2376/tcp
sudo ufw allow 2377/tcp
sudo ufw allow 7946/tcp
sudo ufw allow 7946/udp
sudo ufw allow 4789/udp

# Allow application ports
sudo ufw allow 3000/tcp
sudo ufw allow 4566/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 9000/tcp
```

**CentOS/RHEL/Fedora (firewalld):**
```bash
# Check firewall status
sudo firewall-cmd --state

# Add Docker to trusted zone
sudo firewall-cmd --permanent --zone=trusted --add-interface=docker0
sudo firewall-cmd --permanent --zone=trusted --add-port=2376/tcp

# Allow application ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=4566/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=9000/tcp

# Reload firewall
sudo firewall-cmd --reload
```

### System Resource Limits

Configure system limits for Docker:

```bash
# Check current limits
ulimit -a

# Increase file descriptor limits if needed
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Increase process limits
echo "* soft nproc 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nproc 65536" | sudo tee -a /etc/security/limits.conf

# Apply changes (requires logout/login)
```

## Troubleshooting Linux-Specific Issues

### Issue: Permission Denied for Docker Socket

**Symptoms:**
- Error: "permission denied while trying to connect to the Docker daemon socket"
- Cannot run Docker commands without sudo

**Solutions:**

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or use newgrp
newgrp docker

# Verify group membership
groups $USER

# If still having issues, check socket permissions
ls -la /var/run/docker.sock
sudo chmod 666 /var/run/docker.sock
```

### Issue: Docker Service Not Starting

**Symptoms:**
- Docker commands fail with "Cannot connect to the Docker daemon"
- Service fails to start

**Solutions:**

```bash
# Check Docker service status
sudo systemctl status docker

# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check Docker daemon logs
sudo journalctl -u docker.service

# If service fails to start, check configuration
sudo dockerd --debug
```

### Issue: Out of Disk Space

**Symptoms:**
- Docker build fails with "no space left on device"
- Containers fail to start

**Solutions:**

```bash
# Check disk usage
df -h
docker system df

# Clean up Docker resources
docker system prune -a
docker volume prune

# Remove unused images
docker image prune -a

# Check Docker root directory
sudo du -sh /var/lib/docker

# Move Docker root to larger partition if needed
sudo systemctl stop docker
sudo mv /var/lib/docker /new/location/docker
sudo ln -s /new/location/docker /var/lib/docker
sudo systemctl start docker
```

### Issue: Port Already in Use

**Symptoms:**
- Services fail to start with "port already in use" errors
- Cannot bind to expected ports

**Solutions:**

```bash
# Find processes using ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :4566
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :9000

# Or use ss command
sudo ss -tulpn | grep :3000

# Kill processes using ports
sudo kill -9 <PID>

# Check for services using ports
sudo systemctl list-units --type=service --state=running | grep -E "(apache|nginx|httpd)"

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### Issue: Container Networking Problems

**Symptoms:**
- Containers cannot communicate with each other
- Cannot access services from host

**Solutions:**

```bash
# Check Docker networks
docker network ls

# Inspect default network
docker network inspect bridge

# Check iptables rules (may interfere with Docker)
sudo iptables -L

# Restart Docker networking
sudo systemctl restart docker

# If using custom firewall rules, ensure Docker chains are preserved
sudo iptables -I FORWARD -j DOCKER-USER
```

## Development Workflow on Linux

### Using VS Code

```bash
# Install VS Code (Ubuntu/Debian)
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code

# Install VS Code (Fedora/CentOS)
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
sudo dnf install code

# Install VS Code (Arch Linux)
yay -S visual-studio-code-bin

# Open project
code .
```

### Terminal Configuration

**Bash configuration (`~/.bashrc`):**
```bash
# Add useful aliases
alias ll='ls -la'
alias dc='docker-compose'
alias dcl='docker-compose -f docker-compose.local.yml'
alias dps='docker ps'
alias dlogs='docker-compose -f docker-compose.local.yml logs -f'

# Add project shortcuts
alias cdtattoo='cd ~/Development/tattoo-artist-directory'

# Docker cleanup function
docker-cleanup() {
    docker system prune -a
    docker volume prune
}
```

**Zsh configuration (`~/.zshrc`):**
```bash
# Same aliases as above, plus Oh My Zsh plugins
plugins=(git docker docker-compose node npm)
```

### File Editors

**Command-line editors:**
```bash
# Install vim/neovim
sudo apt install vim neovim  # Ubuntu/Debian
sudo dnf install vim neovim  # Fedora/CentOS
sudo pacman -S vim neovim    # Arch Linux

# Install emacs
sudo apt install emacs       # Ubuntu/Debian
sudo dnf install emacs       # Fedora/CentOS
sudo pacman -S emacs         # Arch Linux
```

**GUI editors:**
```bash
# Install Sublime Text
wget -qO - https://download.sublimetext.com/sublimehq-pub.gpg | sudo apt-key add -
echo "deb https://download.sublimetext.com/ apt/stable/" | sudo tee /etc/apt/sources.list.d/sublime-text.list
sudo apt update && sudo apt install sublime-text

# Install Atom (deprecated, use VS Code instead)
# Install other editors via package manager
```

## Performance Optimization

### System Optimization

```bash
# Increase inotify limits for file watching
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Optimize Docker daemon
sudo mkdir -p /etc/docker
echo '{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}' | sudo tee /etc/docker/daemon.json

sudo systemctl restart docker
```

### Resource Monitoring

```bash
# Monitor system resources
htop
# or
top

# Monitor Docker resources
docker stats

# Monitor disk usage
watch -n 1 df -h

# Monitor network
iftop
# or
nethogs
```

## Next Steps

1. **Verify installation** by accessing all services
2. **Run the test suite** to ensure everything works
3. **Explore the API** using Swagger UI
4. **Start developing** with hot-reload capabilities

## Additional Resources

- [Docker Engine Installation](https://docs.docker.com/engine/install/)
- [Docker Compose Installation](https://docs.docker.com/compose/install/)
- [Node.js Installation Guide](https://nodejs.org/en/download/package-manager/)
- [Linux Development Environment Setup](https://docs.docker.com/desktop/linux/)

## Support

For Linux-specific issues:

1. Check [Linux Troubleshooting](TROUBLESHOOTING_GUIDE.md#linux-specific-issues)
2. Verify Docker Engine and Docker Compose are properly installed
3. Ensure user has proper permissions for Docker
4. Check firewall and SELinux configuration
5. Monitor system resources and disk space