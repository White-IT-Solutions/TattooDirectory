# Tattoo Artist Directory - Next.js Frontend

A comprehensive, serverless tattoo artist directory platform built on AWS. This project serves as a technical portfolio piece demonstrating modern full-stack development practices while solving the real-world problem of fragmented tattoo artist discovery.

## 🎯 Project Overview

The Tattoo Artist Directory creates the most comprehensive directory of UK tattoo artists by aggregating public data from multiple sources, providing clients with a powerful search tool and artists with a zero-effort marketing channel.

This repository contains the Next.js frontend implementation, migrated from the original React + Vite setup.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
# Build the application for production
npm run build
```

This will generate a static export in the `out` directory, ready for deployment to AWS S3/CloudFront.

### Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📂 Project Structure

```
├── app/                     # Next.js App Router pages and layouts
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Landing page
│   ├── search/              # Search page
│   ├── artist/              # Artist profile pages
│   └── ...                  # Other pages
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── ...                  # Custom components
├── lib/                     # Utility functions and shared code
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
├── scripts/                 # Build and testing scripts
└── __tests__/               # Test files
```

## 🔄 Next.js Migration

This project has been migrated from a React + Vite setup to Next.js 14+ with App Router. The migration provides several benefits:

- **Improved Performance**: Better optimization and faster page loads
- **File-based Routing**: Simplified routing with the App Router
- **Static Export**: Optimized for AWS S3/CloudFront deployment
- **Built-in Optimizations**: Automatic image, font, and script optimization
- **Enhanced Developer Experience**: Improved hot reloading and debugging

### Migration Notes

The migration from React + Vite to Next.js involved the following key changes:

1. **Project Structure**: Reorganized from a traditional React structure to Next.js App Router structure
2. **Routing**: Replaced React Router with Next.js file-based routing
3. **Components**: Updated components to work with Next.js, including adding "use client" directives where needed
4. **Build Configuration**: Replaced Vite config with Next.js config
5. **Static Export**: Configured for optimal static site generation

For detailed information about the migration process, see the [Migration Testing Summary](MIGRATION-TESTING-SUMMARY.md).

## 🧪 Testing

The project includes several testing tools and checklists:

- **Functional Testing**: [Testing Checklist](TESTING-CHECKLIST.md)
- **Navigation Testing**: [Navigation Testing Checklist](NAVIGATION-TESTING-CHECKLIST.md)
- **Cross-Browser Testing**: [Cross-Browser Testing Checklist](CROSS-BROWSER-TESTING-CHECKLIST.md)
- **Performance Validation**: [Performance Validation Checklist](PERFORMANCE-VALIDATION-CHECKLIST.md)
- **Static Export Testing**: [Static Export Checklist](STATIC-EXPORT-CHECKLIST.md)

## 🚀 Deployment

### Static Export for AWS S3/CloudFront

The Next.js application is configured for static export, making it ideal for deployment to AWS S3 with CloudFront distribution:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the contents of the `out` directory to an S3 bucket configured for static website hosting.

3. Set up a CloudFront distribution pointing to the S3 bucket.

4. Configure CloudFront to handle client-side routing by setting up error pages to redirect to `index.html`.

## 📚 Additional Documentation

For more information about the overall project, refer to the main documentation in the `/docs` folder:

- **[PRD](../docs/PRD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Product Requirements Document
- **[SRS](../docs/SRS%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Software Requirements Specification  
- **[HLD](../docs/HLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: High-Level Design
- **[LLD](../docs/LLD%20Doc%20Tattoo%20Artist%20Directory%20MVP.md)**: Low-Level Design

## 📊 Success Metrics

- **Technical**: 99.9% uptime, <500ms p95 API latency, 90+ Lighthouse score
- **Product**: 2,000 MAU, 30% search-to-engagement rate, 15% profile CTR
- **Data**: 90% artist coverage in top 5 UK cities, 95% scraping success rate

## 🔒 Data Protection

This project follows strict data protection principles, processing only publicly available information with clear opt-out mechanisms for artists. See the [Data Protection Policy](../docs/DPP%20Doc%20Tattoo%20Artist%20Directory%20MVP.md) for details.

## 📄 License

*License information to be added*

---

**Note**: This is a portfolio project designed to showcase modern cloud development practices and solve a real user problem in the tattoo industry.