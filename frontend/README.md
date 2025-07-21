# Tattoo Artist Directory - Frontend

A modern, responsive React application for discovering tattoo artists. Built with TypeScript, Vite, and shadcn/ui components.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Theming**: next-themes for dark/light mode

## Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── features/           # Feature-specific components
│   │   ├── artist/         # Artist-related components
│   │   ├── search/         # Search and filtering
│   │   └── map/            # Map functionality
│   └── layout/             # Layout components
├── pages/                  # Page components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configurations
├── contexts/               # React contexts
├── types/                  # TypeScript definitions
└── assets/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Or use Bun for faster package management

### Installation

```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

### Implemented Pages

- **Landing Page**: Hero section with search CTA
- **Artist Search**: Advanced filtering and grid/map views
- **Artist Profile**: Detailed artist information and portfolio
- **FAQ**: Frequently asked questions
- **Privacy**: Data protection policy
- **Terms**: Terms of service
- **Status**: System status and uptime

### Key Components

- **StyleFilter**: Multi-select tattoo style filtering
- **MasonryView**: Pinterest-style image gallery
- **Navigation**: Responsive navigation with dark mode toggle
- **DarkModeToggle**: Theme switching functionality

## API Integration

The frontend is designed to integrate with the serverless backend API:

- Artist search and filtering
- Individual artist profiles
- Style taxonomy
- Error handling with RFC 9457 Problem Details

## Deployment

This application is designed to be deployed as a static site on AWS S3 with CloudFront CDN, as outlined in the project architecture documentation.

## Contributing

This is a portfolio project. See the main repository README for the overall project structure and documentation.