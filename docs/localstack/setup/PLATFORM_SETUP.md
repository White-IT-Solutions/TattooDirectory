# Platform-Specific Setup Guide

This guide provides platform-specific instructions for setting up the Tattoo Directory local development environment on Windows, macOS, and Linux.

## Quick Start

The local environment automatically detects your platform and uses the appropriate configuration:

```bash
npm run local:start    # Cross-platform startup
npm run local:stop     # Cross-platform shutdown
npm run local:status   # Check service status
```

## Platform Requirements

### All Platforms

- **Node.js**: 18.0.0 or higher
- **Docker Desktop**: Latest stable version
- **Docker Compose**: v2.0 or higher (included with Docker Desktop)
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: 10GB free disk space

### Platform-Specific Requirements

#### Windows 10/11

- **Docker Desktop for Windows** with WSL2 backend enabled
- **Windows Subsystem for Linux 2 (WSL2)** installed
- **Git for Windows** (for bash script support)

**Installation Steps:**
1. Install WSL2: `wsl --install`
2. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
3. Enable WSL2 integration in Docker Desktop settings
4. Install Node.js from [nodejs.org](https://nodejs.org)

#### macOS (Intel/Apple Silicon)

- **Docker Desktop for Mac**
- **Homebrew** (recommended for package management)

**Installation Steps:**
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and Docker
brew install node
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

#### Linux (Ubuntu/Debian)

- **Docker Engine** and **Docker Compose**
- **curl** and **wget**

**Installation Steps:**
```bash
# Update package index
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply group changes
```

## Platform-Specific Configurations

### Docker Compose Overrides

The system automatically uses platform-specific Docker Compose files:

- **Windows**: `docker-compose.windows.yml`
- **macOS**: `docker-compose.macos.yml`
- **Linux**: `docker-compose.linux.yml`

These files optimize:
- Volume mount performance
- File watching behavior
- Resource allocation
- Network configuration

### Port Configuration

Default ports (configurable in each platform override):

| Service    | Port | Alternative |
|------------|------|-------------|
| Frontend   | 3000 | 3001        |
| Backend    | 9000 | 9001        |
| Swagger UI | 8080 | 8081        |
| LocalStack | 4566 | 4567        |

### Resource Limits

Platform-optimized resource allocation:

#### Windows
- **LocalStack**: 1.5GB RAM, 1 CPU
- **Backend**: 512MB RAM, 0.5 CPU
- **Frontend**: 1GB RAM, 0.5 CPU
- **Total**: ~3GB RAM, 2 CPUs

#### macOS
- **LocalStack**: 1GB RAM, 0.5 CPU
- **Backend**: 512MB RAM, 0.5 CPU
- **Frontend**: 1GB RAM, 0.5 CPU
- **Total**: ~2.5GB RAM, 1.5 CPUs

#### Linux
- **LocalStack**: 1GB RAM, 0.5 CPU
- **Backend**: 256MB RAM, 0.25 CPU
- **Frontend**: 512MB RAM, 0.25 CPU
- **Total**: ~1.8GB RAM, 1 CPU

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check which process is using a port
npm run local:platform-info
npm run local:docker-info

# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000
```

#### Docker Issues
```bash
# Check Docker status
docker --version
docker-compose --version
docker info

# Restart Docker Desktop (Windows/macOS)
# Or restart Docker service (Linux)
sudo systemctl restart docker
```

#### Performance Issues

**Windows:**
- Enable WSL2 backend in Docker Desktop
- Allocate more memory to Docker Desktop (8GB+)
- Use WSL2 file system for better performance

**macOS:**
- Increase Docker Desktop memory allocation
- Use delegated volume mounts for better performance
- Consider using Docker Desktop with VirtioFS

**Linux:**
- Ensure user is in docker group
- Check available memory: `free -h`
- Monitor Docker resource usage: `docker stats`

### Platform-Specific Commands

#### Windows (PowerShell/CMD)
```powershell
# Check system resources
Get-ComputerInfo | Select-Object TotalPhysicalMemory, AvailablePhysicalMemory

# Check port usage
netstat -ano | Select-String ":3000"

# Force stop containers
docker kill $(docker ps -q)
```

#### macOS (Terminal)
```bash
# Check system resources
system_profiler SPHardwareDataType | grep Memory
vm_stat

# Check port usage
lsof -i :3000

# Monitor Docker resource usage
docker stats --no-stream
```

#### Linux (Terminal)
```bash
# Check system resources
free -h
nproc

# Check port usage
ss -tulpn | grep :3000

# Check Docker service status
systemctl status docker
```

## Performance Optimization

### File Watching

The system automatically configures file watching based on platform:

- **Windows**: Uses polling (slower but reliable)
- **macOS**: Uses native fsevents (fast)
- **Linux**: Uses inotify (fast)

### Volume Mounts

Platform-optimized volume mount strategies:

- **Windows**: Cached mounts with polling
- **macOS**: Delegated mounts for performance
- **Linux**: Direct bind mounts (fastest)

### Memory Management

To optimize memory usage:

1. **Close unnecessary applications**
2. **Increase Docker Desktop memory allocation**
3. **Use `npm run local:clean` to free resources**
4. **Monitor with `docker stats`**

## Development Workflow

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

## Environment Variables

Platform-specific environment variables are automatically set:

### Windows
```env
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
CHOKIDAR_INTERVAL=2000
FORCE_COLOR=1
```

### macOS
```env
WATCHPACK_POLLING=false
CHOKIDAR_USEPOLLING=false
TMPDIR=/tmp
```

### Linux
```env
WATCHPACK_POLLING=false
CHOKIDAR_USEPOLLING=false
```

## Support

If you encounter platform-specific issues:

1. **Check the troubleshooting section above**
2. **Run diagnostic commands**: `npm run local:platform-info`
3. **Check Docker logs**: `npm run local:logs`
4. **Verify system requirements**
5. **Create an issue with platform details and error logs**

## Contributing

When contributing platform-specific improvements:

1. **Test on multiple platforms**
2. **Update platform-specific override files**
3. **Document any new requirements**
4. **Update this guide with new information**