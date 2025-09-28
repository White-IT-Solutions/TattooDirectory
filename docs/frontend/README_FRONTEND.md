# Frontend Development Guide

## Architecture Overview

The frontend is a Next.js 15 application with App Router, built for the UK tattoo artist directory:
- **Framework**: Next.js 15 with App Router and React 19
- **Styling**: Tailwind CSS 4 with custom components
- **Maps**: Google Maps API with Places Autocomplete
- **State**: React hooks + API integration
- **Deployment**: Static export to S3 + CloudFront

## Prerequisites

- Node.js 20.x
- Google Maps API key
- Docker & Docker Compose (for local development)

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── artists/            # Artist listing & profiles
│   │   ├── components/         # React components
│   │   ├── faq/                # FAQ page
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   └── takedown/           # Artist removal requests
│   ├── lib/                    # Utilities & API clients
│   └── data/                   # Mock data & test fixtures
├── public/                     # Static assets
├── config/                     # Configuration files
├── env/                        # Environment variables
├── docs/                       # Documentation
└── docker/                     # Docker configurations
```

## Local Development Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp env/.env.local.example env/.env.local

# Add your Google Maps API key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Start Development Server

#### Standalone Mode (Frontend Only)
```bash
npm run dev
# Opens http://localhost:3000
```

#### Full Stack Mode (with Backend)
```bash
# From project root - starts all services
docker-compose -f devtools/docker/docker-compose.local.yml up

# Frontend will be available at http://localhost:3000
# Backend API at http://localhost:9000
```

### 4. Development Scripts
```bash
# Development server
npm run dev

# Development server (Docker compatible)
npm run dev:docker

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Key Features & Pages

### Core Pages
- **Home** (`/`) - Search interface with map and filters
- **Artist Listing** (`/artists`) - Grid/list view of artists
- **Artist Profile** (`/artists/[id]`) - Individual artist details
- **FAQ** (`/faq`) - Frequently asked questions
- **Takedown** (`/takedown`) - Artist removal requests

### Components
- **MapWithSearch** - Google Maps with location search
- **ArtistCard** - Artist preview cards
- **StyleFilter** - Tattoo style filtering
- **Navbar** - Navigation with responsive design
- **Footer** - Site footer with links
- **ErrorBoundary** - Error handling wrapper

## Environment Configuration

### Environment Variables

#### Required
```bash
# Google Maps integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key

# Environment detection
NEXT_PUBLIC_ENVIRONMENT=local|development|production
```

#### API Configuration
```bash
# Local development (mock data mode)
# Leave NEXT_PUBLIC_API_URL unset to use mock data

# Local development (with backend)
NEXT_PUBLIC_API_URL=http://localhost:9000/2015-03-31/functions/function/invocations

# Development environment
NEXT_PUBLIC_API_URL_DEV=https://dev-api.tattoo-directory.co.uk

# Production environment  
NEXT_PUBLIC_API_URL_PROD=https://api.tattoo-directory.co.uk
```

### Environment Files
- `env/.env.local` - Local development
- `env/.env.docker.local` - Docker development
- `env/.env.production` - Production build

## API Integration

### Configuration Helper
The app uses `src/lib/config.js` for environment-aware configuration:

```javascript
// Automatically selects correct API URL based on environment
const apiUrl = getApiUrl();

// Environment detection
const environment = getEnvironment();
```

### API Client
The `src/lib/api.js` provides a unified API interface:

```javascript
// Artist operations
const artists = await fetchArtists({ location, styles, limit });
const artist = await fetchArtist(artistId);

// Search functionality
const results = await searchArtists(query, filters);
```

### Mock Data Mode
When `NEXT_PUBLIC_API_URL` is not set, the app automatically uses mock data from `src/data/mockArtistData.js` for development without a backend.

## Styling & UI

### Tailwind CSS 4
- Custom configuration in `config/tailwind.config.js`
- Global styles in `src/app/globals.css`
- Component-specific styles using Tailwind classes

### Responsive Design
- Mobile-first approach (320px+)
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interfaces for mobile devices

### Performance Optimizations
- Next.js Image component with WebP optimization
- Lazy loading for artist cards and images
- Progressive enhancement for JavaScript features

## Google Maps Integration

### Setup
```javascript
// Component usage
import { MapWithSearch } from '@/components/MapWithSearch';

<MapWithSearch
  onLocationSelect={handleLocationSelect}
  initialLocation={userLocation}
/>
```

### Features
- Places Autocomplete for location search
- Artist markers with custom icons
- Radius-based filtering
- Mobile-responsive map controls

### API Key Configuration
- Restrict API key to your domains
- Enable Maps JavaScript API and Places API
- Set up billing account for production use

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms  
- **CLS (Cumulative Layout Shift)**: <0.1

### Bundle Optimization
- Bundle size: <250KB gzipped
- Code splitting by route
- Dynamic imports for heavy components
- Tree shaking for unused code

### Image Optimization
- WebP format with JPEG fallback
- Responsive images with srcset
- Lazy loading below the fold
- Progressive JPEG for large images

## Testing & Quality

### Code Quality
```bash
# ESLint configuration
npm run lint

# Type checking (if using TypeScript)
npm run type-check
```

### Browser Testing
- Chrome DevTools Lighthouse (target 90+ score)
- Mobile device testing (iOS Safari, Android Chrome)
- Accessibility testing (WCAG 2.1 AA compliance)

## Deployment

### Static Export
The app builds as a static site for S3 deployment:

```bash
# Build static export
npm run build

# Output directory: out/
```

### CI/CD Pipeline
1. **Build**: GitHub Actions builds static site
2. **Deploy**: Upload to S3 bucket
3. **CDN**: CloudFront cache invalidation
4. **DNS**: Route 53 domain routing

### Environment-Specific Builds
- **Development**: Deployed to dev.tattoo-directory.co.uk
- **Production**: Deployed to tattoo-directory.co.uk

## Docker Development

### Local Container
```bash
# Build local image
docker build -f docker/Dockerfile.local -t tattoo-frontend .

# Run container
docker run -p 3000:3000 tattoo-frontend
```

### Docker Compose Integration
The frontend integrates with the full development stack:
- Frontend: http://localhost:3000
- Backend: http://localhost:9000  
- LocalStack: http://localhost:4566
- Swagger UI: http://localhost:8080

## Troubleshooting

### Common Issues

#### API Connection Errors
```bash
# Check environment variables
echo $NEXT_PUBLIC_API_URL

# Verify backend is running
curl http://localhost:9000/health

# Check browser network tab for failed requests
```

#### Google Maps Not Loading
```bash
# Verify API key is set
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Check browser console for API errors
# Ensure API key has correct restrictions
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

### Development Tips
- Use React DevTools for component debugging
- Enable Next.js debug mode: `DEBUG=* npm run dev`
- Check Network tab for API request/response details
- Use Lighthouse for performance analysis

## Documentation

- **Environment Configuration**: `docs/ENVIRONMENT_CONFIGURATION.md`
- **Docker Setup**: `docs/README_DOCKER.md`
- **API Integration**: `src/lib/api.js` (inline documentation)
- **Component Examples**: `src/app/components/` (JSDoc comments)
