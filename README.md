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

Comprehensive project documentation is available in the `/docs` folder:

- **[PRD](docs/PRD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Product Requirements Document
- **[SRS](docs/SRS%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Software Requirements Specification  
- **[HLD](docs/HLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: High-Level Design
- **[LLD](docs/LLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Low-Level Design
- **[DPP](docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Data Protection Policy
- **[Page Descriptions](docs/Page%20Descriptions%20HL%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: UI/UX Specifications

## 🚀 Getting Started

*Implementation details and setup instructions will be added as development progresses.*

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
