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

- **Frontend**: `http://localhost:3000`
- **API Docs**: `http://localhost:8080`
- **LocalStack UI**: `http://localhost:4566/_localstack/cockpit`

## 3. Detailed Setup Instructions

This section provides detailed, step-by-step instructions for setting up the development environment on Windows, macOS, and Linux.

### 3.1. Windows Setup

#### Prerequisites

- **Windows 10/11**: Version 2004 (build 19041) or higher.
- **WSL 2**: Required for Docker Desktop's backend.
- **8GB RAM**: 16GB is recommended.

#### Installation

1.  **Enable WSL 2**:
    Open PowerShell as an administrator and run:
    ```powershell
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    ```
    Restart your computer, then run:
    ```powershell
    wsl --set-default-version 2
    wsl --install -d Ubuntu
    ```

2.  **Install Docker Desktop**:
    - Download and install [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/).
    - In Docker Desktop settings, ensure "Use the WSL 2 based engine" is enabled.

3.  **Install Node.js and Git**:
    The recommended way to install is by using the [Chocolatey](https://chocolatey.org/) package manager:
    ```powershell
    choco install nodejs git
    ```

### 3.2. macOS Setup

#### Prerequisites

- **macOS**: 10.15 (Catalina) or later.
- **8GB RAM**: 16GB is recommended.

#### Installation

1.  **Install Homebrew**:
    Open your terminal and run:
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2.  **Install Docker, Node.js, and Git**:
    ```bash
    brew install --cask docker
    brew install node git
    ```

3.  **Start Docker Desktop**:
    Open Docker from your Applications folder to complete the installation.

### 3.3. Linux Setup (Ubuntu/Debian)

#### Prerequisites

- **Ubuntu/Debian**: Ubuntu 20.04+ or Debian 10+.
- **8GB RAM**: 16GB is recommended.

#### Installation

1.  **Install Docker Engine**:
    ```bash
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    ```

2.  **Install Docker Compose**:
    ```bash
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    ```

3.  **Add user to Docker group**:
    ```bash
    sudo usermod -aG docker $USER
    newgrp docker
    ```

4.  **Install Node.js and Git**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs git
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
cp dev-tools/.env.local.example .env.local
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

### Frontend

- Changes to files in the `frontend/src` directory will trigger a hot-reload in your browser.
- Access the frontend at `http://localhost:3000`.

### Backend

- After making changes to files in the `backend/src` directory, you will need to restart the backend service:
  ```bash
  docker-compose -f dev-tools/docker/docker-compose.local.yml restart backend
  ```
- Test your API changes using the Swagger UI at `http://localhost:8080`.

## 7. Test Data

The project includes a rich set of test data, including artists, studios, and images, to provide a realistic development experience.

### Test Data Structure

- **Artists**: 10 sample artists with professional avatars, portfolios, and contact information.
- **Studios**: 3 studios with locations and artist associations.
- **Styles**: 17 tattoo style categories with descriptions and associated images.

### S3 Image Upload

The local environment uses LocalStack to emulate AWS S3. The test data setup script (`npm run setup` in the `scripts` directory) will automatically:

1.  Create a `tattoo-directory-images` bucket in LocalStack.
2.  Upload over 100 tattoo images to the bucket, organized by style.
3.  Update the test data files with the S3 URLs for the images.

This provides a realistic data set that includes actual images served from an S3-compatible object store.

### Initial Data Setup

This is a one-time step to download and configure the test data and images.

```bash
cd scripts
npm install
npm run setup
cd ..
```

### Resetting Data

To reset the database to its initial state, run:

```bash
npm run seed:clean
npm run seed
```


## 8. Troubleshooting

### Port Conflicts

If a service fails to start due to a port conflict, you can find the conflicting process:

- **Windows**: `netstat -ano | findstr :<port>`
- **macOS/Linux**: `lsof -i :<port>`

### Docker Issues

- **"Docker daemon is not running"**: Make sure Docker Desktop is running.
- **Permission errors**:
  - On Linux, ensure your user is in the `docker` group.
  - On Windows, try running your terminal as an administrator.

### Services Not Responding

- Check the service logs for errors: `npm run local:logs`.
- Run the health checks: `npm run local:health`.
- Try restarting the environment: `npm run local:restart`.

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

A full list of available scripts can be found in the `scripts/README-Development-Workflow.md` file. Here is a summary of the most important scripts:

### Root Level

- `npm run local:start`: Start the complete local environment.
- `npm run local:stop`: Stop all services.
- `npm run local:health`: Check the health of all services.
- `npm run seed`: Seed the database with test data.
- `npm run seed:clean`: Clean the existing seeded data.
- `npm run seed:validate`: Validate the test data files.

### Scripts Directory

- `npm run setup`: Complete the test data setup, including S3 image uploads.
- `npm run upload-images`: Upload images to LocalStack S3.
- `npm run update-data`: Update the test data with S3 URLs.

### Data Seeder Directory

- `npm run seed`: Seed data to LocalStack services.
- `npm run clean`: Clean existing data.
- `npm run validate`: Validate test data files.
