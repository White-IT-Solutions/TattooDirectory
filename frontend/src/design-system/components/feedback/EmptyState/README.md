# EmptyState Components

Comprehensive empty state components with brand personality and engaging copy for the Tattoo Artist Directory. These components provide helpful guidance and clear next steps when content is unavailable.

## Features

- **Brand Personality**: Tattoo-themed illustrations and engaging copy
- **Multiple Variants**: Specialized components for different scenarios
- **Accessibility**: Proper ARIA labels, heading hierarchy, and keyboard navigation
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Design System Integration**: Uses design tokens and consistent styling
- **Loading States**: Animated loading indicators for empty content areas

## Components

### EmptyState (Base Component)

The foundational empty state component with customizable content and illustrations.

```jsx
import EmptyState from '@/design-system/components/feedback/EmptyState/EmptyState';
import Button from '@/design-system/components/ui/Button/Button';

function MyComponent() {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description="Try adjusting your search criteria"
      size="md"
      actions={
        <>
          <Button variant="primary">Try Again</Button>
          <Button variant="outline">Clear Search</Button>
        </>
      }
    />
  );
}
```

#### Props

- `variant` - Illustration variant: `'search' | 'onboarding' | 'favorites' | 'portfolio' | 'loading'`
- `title` - Main heading text
- `description` - Supporting description text
- `illustration` - Custom illustration component (overrides variant)
- `actions` - Action buttons or components
- `size` - Component size: `'sm' | 'md' | 'lg' | 'xl'`
- `className` - Additional CSS classes

### Specialized Variants

#### NoSearchResults

For search pages with no matching results.

```jsx
import { NoSearchResults } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

<NoSearchResults
  searchTerm="traditional tattoo"
  onClearSearch={() => clearSearch()}
  onBrowseAll={() => showAllArtists()}
  suggestions={['Traditional', 'Realism', 'Blackwork']}
/>
```

#### NewUserOnboarding

Welcome screen for new users.

```jsx
import { NewUserOnboarding } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

<NewUserOnboarding
  userName="John"
  onStartExploring={() => navigate('/artists')}
  onViewGuide={() => navigate('/guide')}
/>
```

#### EmptyFavorites

For empty favorites/saved items lists.

```jsx
import { EmptyFavorites } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

<EmptyFavorites
  onBrowseArtists={() => navigate('/artists')}
  onExploreStyles={() => navigate('/styles')}
/>
```

#### EmptyPortfolio

For artist portfolios with no uploaded work.

```jsx
import { EmptyPortfolio } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

// For own profile
<EmptyPortfolio
  isOwnProfile={true}
  onUploadImages={() => openUploadModal()}
/>

// For viewing another artist
<EmptyPortfolio
  isOwnProfile={false}
  artistName="Jane Doe"
  onContactArtist={() => openContactForm()}
/>
```

#### LoadingEmptyState

Animated loading state for empty content areas.

```jsx
import { LoadingEmptyState } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

<LoadingEmptyState message="Loading your favorites..." />
```

#### ErrorEmptyState

Error state that looks like an empty state.

```jsx
import { ErrorEmptyState } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

<ErrorEmptyState
  title="Something went wrong"
  description="We're having trouble loading this content"
  onRetry={() => refetch()}
  onGoHome={() => navigate('/')}
/>
```

#### NoFilterResults

For filtered content with no results.

```jsx
import { NoFilterResults } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

<NoFilterResults
  filterType="styles"
  activeFiltersCount={3}
  onClearFilters={() => clearFilters()}
  onResetAll={() => resetAllFilters()}
/>
```

#### CustomEmptyState

Flexible component for custom scenarios.

```jsx
import { CustomEmptyState } from '@/design-system/components/feedback/EmptyState/EmptyStateVariants';

<CustomEmptyState
  variant="search"
  title="Custom Title"
  description="Custom description"
  primaryAction={{
    label: 'Primary Action',
    onClick: handlePrimary
  }}
  secondaryAction={{
    label: 'Secondary Action',
    onClick: handleSecondary
  }}
  size="lg"
/>
```

## Illustrations

### Available Variants

- **search**: Magnifying glass with tattoo elements for no search results
- **onboarding**: Welcome tattoo machine with sparkles for new users
- **favorites**: Empty heart with floating mini hearts for favorites
- **portfolio**: Empty picture frames with camera for portfolios
- **loading**: Animated loading dots with rotating tattoo machine

### Custom Illustrations

You can provide custom illustrations by passing a component to the `illustration` prop:

```jsx
const CustomIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {/* Your custom SVG content */}
  </svg>
);

<EmptyState
  illustration={<CustomIllustration />}
  title="Custom Empty State"
/>
```

## Design System Integration

### Colors

Uses design token CSS variables for consistent theming:

- `--text-primary` - Main text color
- `--text-secondary` - Secondary text color
- `--color-primary-*` - Brand colors for illustrations
- `--color-accent-*` - Accent colors for highlights
- `--color-neutral-*` - Neutral colors for backgrounds

### Typography

- Titles use `--font-family-heading` (Merienda)
- Descriptions use `--font-family-body` (Geist)
- Proper font weights and line heights from design tokens

### Spacing

- Consistent spacing using `--spacing-*` tokens
- Responsive padding and margins
- Proper visual hierarchy with space-y utilities

## Accessibility

### ARIA Support

- Proper `role="img"` on illustrations
- Descriptive `aria-label` attributes
- Semantic heading structure (h3 for titles)

### Keyboard Navigation

- All action buttons are keyboard accessible
- Proper focus management
- Logical tab order

### Screen Reader Support

- Descriptive text for all visual elements
- Proper heading hierarchy
- Alternative text for illustrations

## Animation

### Loading States

The loading variant includes subtle animations:

- Pulsing dots with staggered timing
- Rotating tattoo machine illustration
- Smooth opacity transitions

### Micro-interactions

- Hover effects on suggestion buttons
- Smooth transitions on all interactive elements
- Floating animations on decorative elements

## Usage Guidelines

### When to Use

- **Search Results**: When search queries return no matches
- **New Users**: First-time user experience and onboarding
- **Empty Collections**: Favorites, portfolios, or saved items
- **Loading States**: While content is being fetched
- **Error Recovery**: When content fails to load

### Best Practices

1. **Provide Clear Actions**: Always include relevant next steps
2. **Use Appropriate Tone**: Match the brand personality (creative but professional)
3. **Be Helpful**: Offer suggestions or alternatives
4. **Stay Consistent**: Use the same variant for similar scenarios
5. **Consider Context**: Choose the right size and actions for the space

### Content Guidelines

- **Titles**: Keep concise and descriptive (2-6 words)
- **Descriptions**: Explain the situation and suggest solutions (1-2 sentences)
- **Actions**: Use action-oriented button labels ("Browse Artists", "Try Again")
- **Tone**: Friendly and encouraging, not apologetic

## Examples

### Search Page

```jsx
function SearchResults({ results, searchTerm, isLoading }) {
  if (isLoading) {
    return <LoadingEmptyState message="Searching for amazing artists..." />;
  }
  
  if (results.length === 0) {
    return (
      <NoSearchResults
        searchTerm={searchTerm}
        onClearSearch={() => setSearchTerm('')}
        onBrowseAll={() => navigate('/artists')}
        suggestions={['Traditional', 'Realism', 'Watercolor']}
      />
    );
  }
  
  return <ResultsList results={results} />;
}
```

### User Dashboard

```jsx
function FavoritesList({ favorites, isNewUser }) {
  if (isNewUser) {
    return (
      <NewUserOnboarding
        onStartExploring={() => navigate('/artists')}
        onViewGuide={() => navigate('/getting-started')}
      />
    );
  }
  
  if (favorites.length === 0) {
    return (
      <EmptyFavorites
        onBrowseArtists={() => navigate('/artists')}
        onExploreStyles={() => navigate('/styles')}
      />
    );
  }
  
  return <FavoritesGrid favorites={favorites} />;
}
```

### Artist Portfolio

```jsx
function ArtistPortfolio({ artist, images, isOwnProfile }) {
  if (images.length === 0) {
    return (
      <EmptyPortfolio
        isOwnProfile={isOwnProfile}
        artistName={artist.name}
        onUploadImages={isOwnProfile ? openUpload : undefined}
        onContactArtist={!isOwnProfile ? openContact : undefined}
      />
    );
  }
  
  return <ImageGallery images={images} />;
}
```

## Testing

Comprehensive test coverage includes:

- Component rendering with all props
- Action button functionality
- Illustration variant switching
- Accessibility compliance
- Responsive behavior
- Animation presence

Run tests with:

```bash
npm test EmptyState
```

## Browser Support

- Modern browsers with CSS custom properties support
- SVG animation support for loading states
- Flexbox support for responsive layouts
- CSS Grid support for action button layouts