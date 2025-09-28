# Quick Start Guide

Get the Tattoo Directory MVP running locally in under 5 minutes.

## Prerequisites

### Required Software

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

### System Requirements

- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **Network**: Internet connection for initial setup

## 5-Minute Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd tattoo-directory-mvp

# Install all dependencies
npm install
```

### 2. Start the Environment

```bash
# Start all services (LocalStack, backend, frontend)
npm run local:start
```

This command will:
- Start LocalStack (AWS services emulation)
- Initialize DynamoDB tables and OpenSearch indices
- Start the backend API server
- Start the frontend development server

### 3. Set Up Test Data

```bash
# Set up complete test dataset
npm run setup-data
```

This creates:
- **10 realistic artists** with professional portfolios
- **3 studios** across London, Manchester, and Birmingham  
- **17 tattoo styles** with actual tattoo images
- **127 high-quality tattoo images** uploaded to S3

### 4. Verify Everything Works

```bash
# Check all services are healthy
npm run local:health
```

You should see:
- ✅ LocalStack services running
- ✅ DynamoDB tables created
- ✅ OpenSearch indices ready
- ✅ Test data loaded
- ✅ Frontend accessible

### 5. Access the Application

Open your browser and visit:

- **Frontend Application**: http://localhost:3000
- **API Documentation**: http://localhost:8080
- **LocalStack Dashboard**: http://localhost:4566/_localstack/cockpit

## What You Get

### Complete Development Environment

- **Full-stack application** running locally
- **AWS services emulation** with LocalStack
- **Hot reload** for frontend and backend development
- **API documentation** with Swagger UI
- **Monitoring dashboard** for service health

### Realistic Test Data

- **10 Professional Artists**:
  - Complete portfolios with 5-15 images each
  - Diverse tattoo styles and specializations
  - Realistic contact information and availability
  - Professional headshots and studio affiliations

- **3 Tattoo Studios**:
  - London: "Ink & Iron Tattoo Studio"
  - Manchester: "Northern Ink Collective" 
  - Birmingham: "Midlands Tattoo House"
  - Complete address and contact details

- **17 Tattoo Styles**:
  - Traditional, Neo-Traditional, Realism
  - Japanese, Blackwork, Geometric
  - Watercolor, Minimalist, Portrait
  - And 8 more popular styles

### Search Functionality

- **Location-based search** with radius filtering
- **Style filtering** with multiple selections
- **Artist availability** and booking status
- **Portfolio browsing** with image galleries
- **Studio information** and directions

## Essential Commands

### Daily Development

```bash
# Start development environment
npm run local:start

# View all service logs
npm run local:logs

# Check service health
npm run local:health

# Stop all services
npm run local:stop
```

### Data Management

```bash
# Reset to clean state
npm run reset-data

# Load specific test scenarios
npm run seed-scenario:london-artists
npm run seed-scenario:high-rated

# Validate data integrity
npm run validate-data
```

### Frontend Development

```bash
# Start frontend only (with mock data)
npm run setup-data:frontend-only
npm run dev:frontend

# Access frontend at http://localhost:3000
```

### Backend Development

```bash
# Start backend services only
npm run dev:backend

# Test API endpoints
npm run local:test-api

# View backend logs
npm run local:logs:backend
```

## Development Workflows

### Frontend-Only Development

Perfect for UI/UX work without backend complexity:

```bash
# Quick frontend setup
npm run setup-data:frontend-only
npm run dev:frontend
```

### Full-Stack Development

Complete environment for API and frontend integration:

```bash
# Complete setup
npm run local:start
npm run setup-data
```

### API Development

Focus on backend services and API endpoints:

```bash
# Start LocalStack and backend
npm run dev:backend
npm run setup-data:images-only
```

## Troubleshooting

### Quick Fixes

#### Services Won't Start
```bash
# Check Docker is running
docker info

# Clean restart
npm run local:reset
```

#### Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :4566

# Stop conflicting services
sudo systemctl stop apache2  # Linux
brew services stop nginx     # macOS
```

#### Memory Issues
```bash
# Check Docker memory allocation
docker stats

# Increase Docker memory in Docker Desktop settings
# Recommended: 8GB minimum, 16GB optimal
```

### Common Issues

#### LocalStack Not Starting
```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Reset LocalStack data
npm run local:clean

# Check logs for errors
npm run local:logs:localstack
```

#### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf frontend/.next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
```bash
# Verify DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Reset database
npm run reset-data:clean
```

### Platform-Specific Issues

#### Windows
- Ensure WSL 2 is enabled for Docker Desktop
- Use PowerShell or WSL bash for commands
- Check Windows Defender isn't blocking Docker

#### macOS
- Increase Docker Desktop memory allocation
- For M1 Macs, ensure Docker Desktop supports ARM64
- Check file permissions for volume mounts

#### Linux
- Add user to docker group: `sudo usermod -aG docker $USER`
- Ensure Docker daemon is running: `sudo systemctl start docker`
- Check firewall settings for port access

## Next Steps

### Explore the Application

1. **Browse Artists**: Visit http://localhost:3000 and explore artist profiles
2. **Test Search**: Try location-based and style filtering
3. **View Portfolios**: Click through artist galleries
4. **API Testing**: Use http://localhost:8080 for API documentation

### Development Guides

- **[Local Development Guide](setup/local-development.md)**: Comprehensive development setup
- **[Frontend Development](setup/frontend-only.md)**: Frontend-specific development
- **[Docker Setup](setup/docker-setup.md)**: Docker configuration details
- **[Dependencies](setup/dependencies.md)**: Project dependencies overview

### Advanced Features

- **[Testing Strategies](../tests/README.md)**: Unit, integration, and E2E testing
- **[Data Management](../scripts/README.md)**: Advanced data seeding and management
- **[Monitoring](../devtools/README.md)**: Performance monitoring and debugging
- **[Deployment](../infrastructure/README.md)**: Production deployment guides

## Support

### Getting Help

- **Documentation**: Check the `docs/` directory for detailed guides
- **Logs**: Use `npm run local:logs` to diagnose issues
- **Health Checks**: Run `npm run local:health` to verify service status
- **GitHub Issues**: Report bugs and request features

### Community Resources

- **Development Workflow**: [scripts/README-Development-Workflow.md](../scripts/README-Development-Workflow.md)
- **API Reference**: Available at http://localhost:8080 when running
- **Architecture Overview**: [docs/system_design/](system_design/)

### Emergency Commands

```bash
# Complete environment reset
npm run local:emergency-stop
npm run local:reset

# Force cleanup and restart
docker system prune -f
npm run local:start
```

---

**🎉 Congratulations!** You now have a fully functional tattoo artist directory running locally. Start exploring the application and building amazing features!