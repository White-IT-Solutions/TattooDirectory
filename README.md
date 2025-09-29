# Tattoo Artist Directory MVP

A comprehensive, serverless tattoo artist directory platform built on AWS. This project serves as a technical portfolio piece demonstrating modern full-stack development practices while solving the real-world problem of fragmented tattoo artist discovery in the UK market.

## 🎯 Project Overview

The Tattoo Artist Directory creates the most comprehensive directory of UK tattoo artists by aggregating public data from multiple sources, providing clients with a powerful search tool and artists with a zero-effort marketing channel.

### Key Features

- **🔍 Advanced Search & Filtering**: Location-based search with radius filtering, style specializations, and keyword matching
- **👨‍🎨 Artist Profile Pages**: Comprehensive profiles with portfolios, contact information, and style specializations
- **🏢 Studio Integration**: Full studio data pipeline with artist-studio relationships and detailed studio profiles
- **🤖 Automated Data Aggregation**: Multi-source scraping engine (Google Maps → Studio Websites → Instagram)
- **⚡ High Performance**: Sub-500ms API responses, 90+ Lighthouse scores, mobile-first design
- **☁️ Serverless Architecture**: Built on AWS using Lambda, DynamoDB, OpenSearch, Step Functions, and Fargate
- **🏗️ Infrastructure as Code**: 100% Terraform-managed infrastructure with automated CI/CD

### Business Value

- **For Clients**: Comprehensive search across UK tattoo artists with location, style, and availability filtering
- **For Artists**: Zero-effort marketing channel with automated profile creation from public data
- **For Studios**: Enhanced visibility with detailed studio profiles and artist relationships

## 🏗️ Architecture & Tech Stack

### System Architecture

The system employs a serverless-first, event-driven architecture with clear separation of concerns:

1. **Core API & Data Platform** (Phase 1): User-facing services for search and profile display
2. **Async Data Aggregation Engine** (Phase 2): Automated data collection and processing

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Lambda        │
│   Next.js 14+  │───▶│   REST API       │───▶│   Node.js       │
│   Tailwind CSS │    │   Rate Limiting  │    │   Business Logic│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────┐              │
                       │   CloudFront    │              ▼
                       │   S3 Static     │    ┌─────────────────┐
                       │   Assets        │    │   Data Layer    │
                       └─────────────────┘    │   DynamoDB      │
                                              │   OpenSearch    │
                                              └─────────────────┘
```

### Technology Stack

#### Frontend (`frontend/` folder)

- **Framework**: Next.js 14+ with App Router
- **UI Components**: shadcn/ui (Radix primitives) + Tailwind CSS
- **State Management**: React Query (server state) + useState (local state)
- **Forms & Validation**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Playwright (E2E)

#### Backend (`backend/` folder)

- **Runtime**: Node.js on AWS Lambda
- **API**: AWS API Gateway with Lambda integration
- **Database**: DynamoDB (single-table design) + OpenSearch (search/filtering)
- **Processing**: Step Functions + Fargate for data pipelines
- **Storage**: S3 for static assets, CloudFront CDN

#### Infrastructure (`infrastructure/` folder)

- **IaC**: Terraform with modular architecture
- **Cloud Provider**: AWS only
- **Environments**: Dev, Staging, Production with environment-specific configs
- **CI/CD**: GitHub Actions with automated deployments

#### Development Tools (`devtools/` folder)

- **Local Development**: Docker + LocalStack for AWS service emulation
- **Monitoring**: Comprehensive health checks and performance monitoring
- **Data Management**: Unified data seeding and validation system

## Project Structure

```
tattoo-directory-mvp/
├── 📁 frontend/                 # Next.js web application
│   ├── src/app/                 # App Router pages & layouts
│   ├── src/components/          # React components
│   │   ├── ui/                  # shadcn/ui primitives
│   │   └── [feature]/           # Feature-specific components
│   ├── src/lib/                 # Utilities & configurations
│   └── public/                  # Static assets
├── 📁 backend/                  # AWS Lambda functions
│   ├── src/handlers/            # API Gateway handlers
│   ├── src/services/            # Business logic services
│   └── src/utils/               # Shared utilities
├── 📁 infrastructure/           # Terraform Infrastructure as Code
│   ├── environments/           # Environment-specific configs (dev/staging/prod)
│   ├── modules/                # Reusable Terraform modules
│   └── bootstrap/              # Initial infrastructure setup
├── 📁 scripts/                  # Development and deployment scripts
│   ├── data-seeder/            # LocalStack data seeding
│   └── test-data/              # Realistic test data with S3 images
├── 📁 devtools/                 # Development utilities & tooling
│   ├── docker/                 # Docker configurations
│   └── monitoring/             # Local monitoring setup
├── 📁 tests/                    # Integration and E2E tests
└── 📁 docs/                     # Comprehensive project documentation
```

## 📚 Documentation

### 🚀 Getting Started

- **[Quick Start Guide](docs/QUICK_START.md)**: Get running in under 5 minutes
- **[Local Development](docs/setup/local-development.md)**: Complete development environment setup
- **[Frontend Only Setup](docs/setup/frontend-only.md)**: Frontend-only development
- **[Docker Setup](docs/setup/docker-setup.md)**: Docker configuration details
- **[Dependencies](docs/setup/dependencies.md)**: Project dependencies overview

### 🏗️ Architecture & Design

- **[System Architecture](docs/architecture/)**: High-level system design and patterns
- **[Data Models](docs/architecture/)**: Database schema and relationships
- **[API Design](docs/architecture/)**: RESTful API architecture patterns
- **[Infrastructure](docs/architecture/infrastructure/)**: AWS infrastructure design

### 🔧 Development Guides

- **[Development Guide](docs/workflows/DEVELOPMENT_GUIDE.md)**: Comprehensive development workflow
- **[Data Management](docs/workflows/data-management.md)**: Data operations and seeding
- **[Testing Strategies](docs/workflows/testing-strategies.md)**: Testing approaches and best practices
- **[Monitoring](docs/workflows/monitoring.md)**: System monitoring and debugging

### 📖 Reference Documentation

- **[API Reference](docs/reference/api_reference.md)**: Complete API documentation
- **[Command Reference](docs/reference/command-reference.md)**: All available CLI commands
- **[Configuration](docs/reference/configuration.md)**: Configuration options and environment variables
- **[npm Scripts](docs/reference/npm-scripts.md)**: Package.json scripts reference

### 🧪 Testing & Quality

- **[Testing Guide](docs/testing/CONSOLIDATED_TEST_DOCUMENTATION.md)**: Comprehensive testing documentation
- **[API Testing](docs/testing/API_TESTING_GUIDE.md)**: API testing strategies
- **[Component Testing](docs/testing/component_testing.md)**: Frontend component testing
- **[Production Parity](docs/testing/PRODUCTION-PARITY-VALIDATION.md)**: Production validation

### 🚀 Deployment & Operations

- **[Deployment Process](docs/workflows/deployment-process.md)**: Deployment workflows and CI/CD
- **[Terraform Guide](docs/deployment/terraform.md)**: Infrastructure deployment
- **[CI/CD Pipeline](docs/deployment/ci-cd.md)**: Continuous integration and deployment

### 🔧 Troubleshooting & Support

- **[Troubleshooting Guide](docs/troubleshooting/TROUBLESHOOTING_GUIDE.md)**: Common issues and solutions
- **[Troubleshooting Master](docs/troubleshooting/TROUBLESHOOTING_MASTER.md)**: Comprehensive troubleshooting reference

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

**System Requirements:**

- RAM: 8GB minimum (16GB recommended)
- Storage: 10GB free space
- Network: Internet connection for initial setup

### Quick Start (5 minutes)

**New to the project?** Follow these steps to get running in under 5 minutes:

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd tattoo-directory-mvp
npm install

# 2. Set up complete development environment
npm run setup-data

# 3. Start all services
npm run local:start

# 4. Verify everything is running
npm run local:health
```

**Access Points:**

- 🌐 **Frontend**: http://localhost:3000
- 📚 **API Documentation**: http://localhost:8080
- ⚙️ **LocalStack UI**: http://localhost:4566/\_localstack/cockpit
- 🔍 **API Endpoints**: http://localhost:3000/api

### Development Environments

#### Full-Stack Development

Complete environment with all services running locally:

```bash
# Complete setup with LocalStack, DynamoDB, OpenSearch
npm run local:start
npm run setup-data

# What you get:
# ✅ 10 realistic artists with professional portfolios
# ✅ 3 studios across London, Manchester, Birmingham
# ✅ 17 tattoo styles with actual tattoo images
# ✅ Full search functionality with location/style filtering
# ✅ Complete API with Swagger documentation
```

#### Frontend-Only Development

For UI development without AWS services:

```bash
# Generate mock data and start frontend
npm run setup-data:frontend-only
npm run dev:frontend

# Access at: http://localhost:3000
```

#### API Development

Focus on backend services and API endpoints:

```bash
# Start LocalStack and backend services
npm run dev:backend
npm run setup-data:images-only
```

### Essential Commands

#### Daily Development

```bash
# Start development environment
npm run local:start

# Check service health
npm run local:health

# View service logs
npm run local:logs

# Stop all services
npm run local:stop

# Clean restart
npm run local:reset
```

#### Data Management

```bash
# Complete setup (images, databases, frontend)
npm run setup-data

# Reset to clean state for testing
npm run local:reset

# Load specific test scenarios
npm run seed-scenario:minimal          # Quick testing (3 artists, 2 studios)
npm run seed-scenario:london-artists   # Location testing (5 London artists, 3 studios)
npm run seed-scenario:full-dataset     # Complete testing (10 artists, 6 studios)

# System health and validation
npm run local:health                   # Check service connectivity
npm run validate-data                  # Validate data consistency
npm run data-status                    # Get current system status
```

#### Testing

```bash
# Run all tests
npm run test:all

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Comprehensive test suite
npm run test:comprehensive
```

### What You Get

After running `npm run setup-data`, you'll have:

- **10 Professional Artists** with complete portfolios (5-15 images each)
- **3 Tattoo Studios** across major UK cities with full contact details
- **17 Tattoo Styles** including Traditional, Realism, Japanese, Blackwork, etc.
- **Full Search Functionality** with location-based and style filtering
- **Complete API** with Swagger documentation
- **Realistic Test Data** with professional images and contact information

### Platform-Specific Setup

#### Windows

- Ensure WSL 2 is enabled for Docker Desktop
- Use PowerShell or WSL bash for commands
- Check Windows Defender isn't blocking Docker

#### macOS

- Increase Docker Desktop memory allocation to 8GB+
- For M1 Macs, ensure Docker Desktop supports ARM64

#### Linux

- Add user to docker group: `sudo usermod -aG docker $USER`
- Ensure Docker daemon is running: `sudo systemctl start docker`

## 🎯 Key Features & Implementation

### Core Features

#### 🔍 Advanced Search & Filtering

- **Location-based Search**: Postcode, city name, radius filtering (1-50 miles)
- **Style Filtering**: Multi-select from 17+ tattoo styles (Traditional, Realism, Japanese, etc.)
- **Keyword Matching**: Search artist names, studio names, specializations
- **Sorting Options**: Distance, recent work, portfolio size, ratings
- **Results Display**: Max 50 per page with infinite scroll on mobile

#### 👨‍🎨 Artist Profiles

- **Portfolio Display**: 5-20 high-quality images per artist (WebP optimized)
- **Contact Information**: Verified Instagram handles, phone numbers, booking links
- **Style Specializations**: Up to 5 primary tattoo styles per artist
- **Studio Affiliation**: Linked to verified studio profiles
- **Availability Status**: Current booking availability and wait times

#### 🏢 Studio Integration

- **Studio Profiles**: Complete studio information with portfolio galleries
- **Artist Relationships**: Full artist-studio relationship management
- **Location Data**: Validated UK postcodes with map integration
- **Contact Methods**: Phone, email, website, social media links

#### ⚡ Performance & Quality

- **API Performance**: <300ms p95 response times
- **Search Speed**: <500ms total search response time
- **Frontend Performance**: 90+ Lighthouse score on all pages
- **Mobile Optimization**: Mobile-first design, works on 320px+ screens
- **Image Optimization**: WebP format with progressive loading

### Technical Implementation

#### Data Architecture

- **Primary Storage**: DynamoDB with single-table design using composite keys
- **Search Engine**: OpenSearch for location/style filtering and full-text search
- **Caching Strategy**: CloudFront (1-year static), API Gateway (5-minute responses)
- **Image Processing**: Automatic WebP conversion and multi-size generation

#### API Design

- **RESTful Endpoints**: Consistent HTTP methods and status codes
- **Input Validation**: Zod schema validation for all API inputs
- **Error Handling**: Structured error responses with proper logging
- **Rate Limiting**: API Gateway throttling and usage plans

#### Security & Privacy

- **Data Sources**: Public information only (Google Maps, Instagram, websites)
- **Privacy Controls**: Clear opt-out mechanisms for all artist profiles
- **Input Validation**: Comprehensive validation to prevent injection attacks
- **Access Control**: IAM least-privilege principle throughout

## 🚀 Development Workflow

### npm Workspaces Structure

This project uses npm workspaces for efficient monorepo management:

```json
{
  "workspaces": [
    "frontend",     # Next.js web application
    "backend",      # AWS Lambda functions
    "scripts",      # Development and deployment scripts
    "tests/integration",  # Integration test suite
    "tests/e2e"     # End-to-end test suite
  ]
}
```

### Development Commands by Workspace

```bash
# Frontend development
npm run dev --workspace=frontend
npm run test --workspace=frontend
npm run build --workspace=frontend

# Backend development
npm run test --workspace=backend
npm run test:coverage --workspace=backend

# Scripts and tooling
npm run seed --workspace=scripts
npm run validate --workspace=scripts

# Cross-workspace operations
npm run test --workspaces          # Run tests in all workspaces
npm run build --workspaces         # Build all workspaces
```

### Code Quality Standards

#### Mandatory Standards

- **TypeScript**: Strict mode enabled across all workspaces
- **ESLint + Prettier**: Consistent code formatting and linting
- **Test Coverage**: 80%+ coverage on core features
- **Performance**: API responses <300ms, Lighthouse score 90+
- **Security**: Input validation, no sensitive data exposure

#### Naming Conventions

- **Files**: kebab-case (`artist-profile.tsx`, `user-service.js`)
- **Components**: PascalCase (`ArtistCard`, `SearchFilters`)
- **Functions**: camelCase (`getArtistById`, `validatePostcode`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RESULTS`)
- **Database Keys**: Composite format (`ARTIST#{artistId}`, `STUDIO#{studioId}`)

## 📊 Success Metrics & Targets

### Technical Performance

- **Uptime**: 99.9% availability target
- **API Latency**: <300ms p95 response times
- **Search Performance**: <500ms total search response time
- **Frontend Performance**: 90+ Lighthouse score on all pages
- **Mobile Performance**: Core Web Vitals - LCP <2.5s, FID <100ms, CLS <0.1

### Product Metrics

- **User Engagement**: 30% search-to-profile-view conversion rate
- **Profile Quality**: 95% of profiles have 5+ portfolio images
- **Geographic Coverage**: 90% artist coverage in top 5 UK cities
- **Data Quality**: 95% scraping success rate, <5% duplicate profiles

### Data Quality Targets

- **Artist Coverage**: 2,000+ verified UK tattoo artists
- **Studio Coverage**: 500+ verified tattoo studios
- **Data Freshness**: Weekly updates for active profiles
- **Image Quality**: All images >800px width, WebP optimized

## 🔒 Data Protection & Privacy

This project follows strict data protection principles:

### Data Sources & Collection

- **Public Data Only**: Processes only publicly available information
- **Source Transparency**: Clear attribution of data sources (Google Maps, Instagram, websites)
- **Opt-out Mechanisms**: Simple process for artists to request profile removal
- **Data Minimization**: Collects only necessary information for directory functionality

### Privacy Controls

- **No Personal Data**: No collection of private contact details or personal information
- **Professional Focus**: Business/professional information only
- **User Control**: Artists can request updates or removal at any time
- **Compliance**: Follows UK GDPR requirements for data processing

### Security Measures

- **Input Validation**: Comprehensive validation using Zod schemas
- **Access Control**: IAM least-privilege principle throughout AWS infrastructure
- **Error Handling**: No sensitive information exposed in error messages
- **Audit Logging**: Complete audit trail of data access and modifications

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Follow the [Development Guide](docs/workflows/DEVELOPMENT_GUIDE.md)
4. Run tests: `npm run test:all`
5. Submit a pull request

### Code Standards

- Follow the established naming conventions and code quality standards
- Ensure all tests pass and maintain 80%+ coverage
- Update documentation for new features
- Follow the security and performance guidelines

### Getting Help

- **Documentation**: Check the comprehensive `docs/` directory
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join project discussions for questions and ideas

---

**Project Status**: Active Development | **Version**: 1.0.0 | **Last Updated**: September 2025

**Note**: This is a portfolio project designed to showcase modern cloud development practices while solving a real user problem in the UK tattoo industry.
