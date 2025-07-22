# Design Document: React to Next.js Migration

## Overview

This design document outlines the migration strategy for converting the Tattoo Artist Directory frontend from a React + Vite setup to Next.js 14+ with App Router. The migration will preserve all existing functionality while leveraging Next.js's built-in optimizations, file-based routing, and static export capabilities for AWS S3/CloudFront deployment.

## Architecture

### Current Architecture (React + Vite)
- **Build Tool**: Vite with React SWC plugin
- **Routing**: React Router DOM with client-side routing
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui with Radix UI primitives
- **State Management**: React Query for server state, React Context for theme
- **TypeScript**: Full TypeScript support with path aliases

### Target Architecture (Next.js)
- **Framework**: Next.js 14+ with App Router
- **Routing**: File-based routing with app directory structure
- **Rendering**: Static Site Generation (SSG) with static export
- **Styling**: Tailwind CSS (preserved)
- **Components**: shadcn/ui (preserved)
- **State Management**: React Query + Next.js built-in features
- **Deployment**: Static export optimized for S3/CloudFront

## Components and Interfaces

### Folder Structure Migration

#### Current Structure (React + Vite)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── Navigation.tsx
│   ├── pages/            # Route components
│   │   ├── Landing.tsx
│   │   ├── ArtistSearch.tsx
│   │   ├── ArtistProfile.tsx
│   │   ├── Privacy.tsx
│   │   ├── Terms.tsx
│   │   ├── FAQ.tsx
│   │   ├── Status.tsx
│   │   └── NotFound.tsx
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── types/            # TypeScript types
│   ├── assets/           # Static assets
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static files
└── package.json
```

#### Target Structure (Next.js App Router)
```
frontend/
├── app/
│   ├── globals.css       # Global styles (from src/index.css)
│   ├── layout.tsx        # Root layout (replaces App.tsx structure)
│   ├── page.tsx          # Landing page (from pages/Landing.tsx)
│   ├── search/
│   │   └── page.tsx      # Artist search (from pages/ArtistSearch.tsx)
│   ├── artist/
│   │   └── [id]/
│   │       └── page.tsx  # Artist profile (from pages/ArtistProfile.tsx)
│   ├── privacy/
│   │   └── page.tsx      # Privacy page
│   ├── terms/
│   │   └── page.tsx      # Terms page
│   ├── faq/
│   │   └── page.tsx      # FAQ page
│   ├── status/
│   │   └── page.tsx      # Status page
│   └── not-found.tsx     # 404 page
├── components/
│   ├── ui/               # shadcn/ui components (preserved)
│   ├── Navigation.tsx    # Navigation component
│   └── providers/        # Client-side providers
│       ├── QueryProvider.tsx
│       └── ThemeProvider.tsx
├── lib/                  # Utilities (preserved)
├── hooks/                # Custom hooks (preserved)
├── types/                # TypeScript types (preserved)
├── public/               # Static files (preserved)
├── next.config.js        # Next.js configuration
└── package.json          # Updated dependencies
```

### Key Migration Components

#### 1. Root Layout (`app/layout.tsx`)
Replaces the provider structure from `App.tsx`:
```typescript
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Sonner } from '@/components/ui/sonner'
import Navigation from '@/components/Navigation'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Navigation />
              {children}
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
```

#### 2. Client-Side Providers
Extract client-side providers to separate components with "use client" directive:

**QueryProvider** (`components/providers/QueryProvider.tsx`):
```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

#### 3. Page Components Migration
Convert existing page components to Next.js page structure:

**Landing Page** (`app/page.tsx`):
```typescript
import Landing from '@/components/pages/Landing'

export default function HomePage() {
  return <Landing />
}
```

**Dynamic Artist Profile** (`app/artist/[id]/page.tsx`):
```typescript
import ArtistProfile from '@/components/pages/ArtistProfile'

export default function ArtistProfilePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return <ArtistProfile id={params.id} />
}
```

## Data Models

### Configuration Updates

#### Next.js Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
}

module.exports = nextConfig
```

#### TypeScript Configuration Updates
Update `tsconfig.json` for Next.js:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Package.json Updates
Key dependency changes:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    // ... existing dependencies preserved
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    // ... other dev dependencies
  }
}
```

## Error Handling

### Static Export Considerations
1. **Dynamic Routes**: Use `generateStaticParams` for dynamic routes
2. **API Routes**: Not supported in static export - ensure all API calls are external
3. **Image Optimization**: Disable Next.js image optimization for static export
4. **Routing**: Configure trailing slashes for S3 compatibility

### Migration Error Handling
1. **Import Path Updates**: Update all imports to use new structure
2. **Router Migration**: Replace `react-router-dom` with Next.js navigation
3. **Client Components**: Add "use client" directive where needed
4. **Static Assets**: Ensure all assets are properly referenced

## Testing Strategy

### Migration Validation
1. **Functional Testing**: Verify all pages render correctly
2. **Routing Testing**: Ensure all routes work with Next.js App Router
3. **Component Testing**: Validate all components function identically
4. **Build Testing**: Confirm static export generates correctly
5. **Deployment Testing**: Test static files work on S3/CloudFront

### Performance Validation
1. **Bundle Size**: Compare bundle sizes before/after migration
2. **Load Times**: Measure page load performance
3. **Lighthouse Scores**: Ensure scores meet or exceed current performance
4. **Core Web Vitals**: Validate all metrics remain optimal

## Deployment Considerations

### Static Export Optimization
1. **Build Output**: Configure for static HTML/CSS/JS generation
2. **Asset Optimization**: Leverage Next.js built-in optimizations
3. **Routing**: Ensure client-side routing works with S3/CloudFront
4. **Caching**: Configure appropriate cache headers for static assets

### AWS S3/CloudFront Compatibility
1. **Index Files**: Ensure proper index.html generation for routes
2. **404 Handling**: Configure custom 404 page for SPA behavior
3. **MIME Types**: Ensure proper content types for all assets
4. **Compression**: Enable gzip/brotli compression for optimal delivery