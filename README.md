# Tattoo Artist Directory MVP

A comprehensive, serverless tattoo artist directory platform built on AWS. This project serves as a technical portfolio piece demonstrating modern full-stack development practices while solving the real-world problem of fragmented tattoo artist discovery.

## 🎯 Project Overview

The Tattoo Artist Directory creates the most comprehensive directory of UK tattoo artists by aggregating public data from multiple sources, providing clients with a powerful search tool and artists with a zero-effort marketing channel.

### Key Features

- **Automated Data Aggregation**: Multi-source scraping engine (Google Maps → Studio Websites → Instagram)
- **Advanced Search & Filtering**: Search by style, location, and keywords with grid and map views
- **Artist Profile Pages**: Comprehensive profiles with portfolios, styles, and contact information
- **Serverless Architecture**: Built on AWS using Lambda, DynamoDB, OpenSearch, Step Functions, and Fargate
- **Infrastructure as Code**: 100% Terraform-managed infrastructure with automated CI/CD

## 🏗️ Architecture

The system employs a serverless-first, event-driven architecture with two main components:

1. **Core API & Data Platform** (Phase 1): User-facing services for search and profile display
2. **Async Data Aggregation Engine** (Phase 2): Automated data collection and processing

### Tech Stack

- **Frontend**: Next.js SPA hosted on S3/CloudFront
- **Backend**: API Gateway + Lambda functions
- **Data**: DynamoDB (primary) + OpenSearch (search/filtering)
- **Processing**: Step Functions + Fargate for data aggregation
- **Infrastructure**: AWS services with Terraform IaC

## 📚 Documentation

### Development Documentation

- **[Data Management Guide](docs/DATA_MANAGEMENT_GUIDE.md)**: Complete guide to the unified data management system
- **[Migration Guide](docs/MIGRATION_GUIDE.md)**: Migrating from legacy scripts to the new system
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)**: Common issues and solutions

### Project Documentation

Comprehensive project documentation is available in the `/docs` folder:

- **[PRD](docs/PRD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Product Requirements Document
- **[SRS](docs/SRS%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Software Requirements Specification  
- **[HLD](docs/HLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: High-Level Design
- **[LLD](docs/LLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Low-Level Design
- **[DPP](docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Data Protection Policy
- **[Page Descriptions](docs/Page%20Descriptions%20HL%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: UI/UX Specifications

## 🚀 Getting Started

### Quick Start (5 minutes)

**New to the project?** Follow the [Quick Start Guide](QUICK_START.md) to get running in under 5 minutes.

### Local Development Environment

Set up the complete local development environment with the unified data management system:

```bash
# 1. Install dependencies
npm install

# 2. Start LocalStack services
docker-compose up -d localstack

# 3. Set up complete development environment
npm run setup-data

# 4. Verify everything is running
npm run health-check
```

**Access Points:**
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8080  
- LocalStack UI: http://localhost:4566/_localstack/cockpit

### Frontend Development Only

For frontend-only development (no AWS services required):

```bash
# Generate mock data without LocalStack
npm run setup-data:frontend-only

# Start frontend development
cd frontend
npm install
npm run dev
```

### Data Management Commands

The project includes a unified data management system for easy development:

```bash
# Complete setup (images, databases, frontend)
npm run setup-data

# Reset to clean state for testing
npm run reset-data:clean

# Seed specific test scenarios
npm run seed-scenario:minimal          # Quick testing (3 artists)
npm run seed-scenario:london-artists   # Location testing (5 London artists)
npm run seed-scenario:full-dataset     # Complete testing (10 artists)

# System health and validation
npm run health-check                   # Check service connectivity
npm run validate-data                  # Validate data consistency
npm run data-status                    # Get current system status
```

For complete documentation, see the [Data Management Guide](docs/DATA_MANAGEMENT_GUIDE.md).

### Project Structure

```
├── docs/                    # Comprehensive project documentation
├── frontend/                # Next.js web application
├── backend/                 # AWS Lambda functions and APIs
├── infrastructure/          # Terraform Infrastructure as Code
├── scripts/                 # Development and deployment scripts
│   ├── data-seeder/        # LocalStack data seeding
│   └── test-data/          # Realistic test data with S3 images
└── tests/                   # Integration and E2E tests
```

### Development Scripts

The project uses a unified data management system. See the [Data Management Guide](docs/DATA_MANAGEMENT_GUIDE.md) for complete documentation.

**Essential Commands:**
```bash
# Data Management (New Unified System)
npm run setup-data          # Complete environment setup
npm run reset-data          # Reset to clean state
npm run seed-scenario       # Load test scenarios
npm run health-check        # Verify system health
npm run validate-data       # Check data consistency
npm run data-status         # Get system status

# Legacy Commands (Still Available)
npm run local:start         # Start LocalStack services
npm run local:stop          # Stop all services
npm run local:health        # Basic health check
npm run local:logs          # View service logs
```

**Migration Note:** The new unified system consolidates 40+ scattered scripts into simple commands. See the [Migration Guide](docs/MIGRATION_GUIDE.md) for transitioning from legacy scripts.

## 📊 Success Metrics

- **Technical**: 99.9% uptime, <500ms p95 API latency, 90+ Lighthouse score
- **Product**: 2,000 MAU, 30% search-to-engagement rate, 15% profile CTR
- **Data**: 90% artist coverage in top 5 UK cities, 95% scraping success rate

## 🔒 Data Protection

This project follows strict data protection principles, processing only publicly available information with clear opt-out mechanisms for artists. See the [Data Protection Policy](docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md) for details.

## 📄 License

*License information to be added*

---

**Note**: This is a portfolio project designed to showcase modern cloud development practices and solve a real user problem in the tattoo industry.
