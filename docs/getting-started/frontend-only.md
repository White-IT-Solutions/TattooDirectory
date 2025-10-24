# Frontend-Only Development Setup

For UI/UX work without backend dependencies - perfect for designers and frontend developers who want to work on the interface without setting up the full stack.

## Quick Setup

```bash
# Install dependencies
npm install

# Start frontend only
npm run local:logs:frontend

# Setup frontend mock data
npm run setup-data:frontend-only
```

## What You Get

- **Frontend Application**: http://localhost:3000
- **Hot Reload**: Automatic refresh on file changes
- **Mock Data**: Realistic artist and studio data for development
- **Component Library**: Access to all UI components
- **Style Guide**: Consistent design system

## Mock Data

The frontend-only setup includes:
- **10 Mock Artists** with portfolios and contact information
- **3 Mock Studios** with locations and specialties
- **17 Tattoo Styles** with sample images
- **Search Functionality** with realistic filtering

## Development Workflow

1. **Make UI Changes**: Edit files in `frontend/src/`
2. **See Changes**: Browser automatically refreshes
3. **Test Components**: Use mock data to test all states
4. **Style Development**: Work with Tailwind CSS and shadcn/ui components

## Available Scripts

```bash
# Development
npm run local:logs:frontend          # Start frontend dev server
npm run local:logs:frontend        # Build for production
npm run local:logs:frontend         # Run frontend tests

# Mock data management
npm run setup-data:frontend-only  # Setup mock data
npm run local:reset       # Reset mock data
```

## File Structure

Focus on these directories for frontend development:

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── [feature]/      # Feature-specific components
│   ├── lib/                # Utilities & configurations
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript definitions
├── public/                 # Static assets
└── styles/                 # Global styles
```

## Component Development

### Using shadcn/ui Components

```jsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ArtistCard({ artist }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{artist.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>View Portfolio</Button>
      </CardContent>
    </Card>
  )
}
```

### Working with Mock Data

```jsx
import { useMockArtists } from "@/hooks/useMockData"

export function ArtistList() {
  const { artists, loading } = useMockArtists()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {artists.map(artist => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  )
}
```

## Styling

The project uses:
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent component design
- **CSS Variables** for theming
- **Responsive Design** with mobile-first approach

## Testing

```bash
# Run frontend tests
npm run local:logs:frontend

# Run tests in watch mode
npm run test:frontend:watch

# Run tests with coverage
npm run test:frontend:coverage
```

## When to Use Full Development

Switch to full development setup when you need:
- **Real API Integration**: Testing with actual backend
- **Database Operations**: Working with real data
- **Authentication**: Testing login/logout flows
- **Performance Testing**: Load testing with real services

For full development setup, see [local-development.md](./local-development.md).

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Kill process using port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm run local:logs:frontend
```

**Mock data not loading:**
```bash
# Reset mock data
npm run setup-data:frontend-only
```

**Component not found:**
- Check import paths are correct
- Ensure component is exported properly
- Verify file naming conventions

### Getting Help

- Check [Component Documentation](../components/frontend/README.md)
- Review [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING_GUIDE.md)
- See [Development Workflow](../workflows/DEVELOPMENT_GUIDE.md)