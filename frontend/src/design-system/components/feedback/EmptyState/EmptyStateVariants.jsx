"use client";

import EmptyState from './EmptyState';
import Button from '../../ui/Button/Button';

/**
 * Specialized empty state components for common scenarios
 * Each variant includes appropriate copy, actions, and brand personality
 */

/**
 * No search results empty state
 */
export function NoSearchResults({ 
  searchTerm, 
  onClearSearch, 
  onBrowseAll,
  suggestions = [],
  className 
}) {
  const title = searchTerm 
    ? `No artists found for "${searchTerm}"`
    : "No artists found";

  const description = searchTerm
    ? "Try adjusting your search criteria or explore different styles and locations."
    : "We couldn't find any artists matching your current filters.";

  const actions = (
    <>
      {onClearSearch && (
        <Button 
          variant="outline" 
          onClick={onClearSearch}
          size="md"
        >
          Clear Search
        </Button>
      )}
      {onBrowseAll && (
        <Button 
          variant="primary" 
          onClick={onBrowseAll}
          size="md"
        >
          Browse All Artists
        </Button>
      )}
    </>
  );

  return (
    <div className={className}>
      <EmptyState
        variant="search"
        title={title}
        description={description}
        actions={actions}
        size="lg"
      />
      
      {/* Search suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Try searching for:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onClearSearch?.(suggestion)}
                className="px-3 py-1 text-sm bg-[var(--color-primary-100)] text-[var(--color-primary-700)] rounded-full hover:bg-[var(--color-primary-200)] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * New user onboarding empty state
 */
export function NewUserOnboarding({ 
  onStartExploring, 
  onViewGuide,
  userName,
  className 
}) {
  const title = userName 
    ? `Welcome to the tattoo community, ${userName}!`
    : "Welcome to your tattoo journey!";

  const description = "Discover incredible artists, explore unique styles, and find the perfect tattoo for your story. Let's get you started on this creative adventure.";

  const actions = (
    <>
      {onStartExploring && (
        <Button 
          variant="primary" 
          onClick={onStartExploring}
          size="lg"
        >
          Start Exploring Artists
        </Button>
      )}
      {onViewGuide && (
        <Button 
          variant="outline" 
          onClick={onViewGuide}
          size="lg"
        >
          View Getting Started Guide
        </Button>
      )}
    </>
  );

  return (
    <EmptyState
      variant="onboarding"
      title={title}
      description={description}
      actions={actions}
      size="xl"
      className={className}
    />
  );
}

/**
 * Empty favorites list
 */
export function EmptyFavorites({ 
  onBrowseArtists, 
  onExploreStyles,
  className 
}) {
  const title = "No favorites yet";
  const description = "Start building your collection of favorite artists and styles. Heart the artists you love to keep track of them here.";

  const actions = (
    <>
      {onBrowseArtists && (
        <Button 
          variant="primary" 
          onClick={onBrowseArtists}
          size="md"
        >
          Browse Artists
        </Button>
      )}
      {onExploreStyles && (
        <Button 
          variant="outline" 
          onClick={onExploreStyles}
          size="md"
        >
          Explore Styles
        </Button>
      )}
    </>
  );

  return (
    <EmptyState
      variant="favorites"
      title={title}
      description={description}
      actions={actions}
      size="md"
      className={className}
    />
  );
}

/**
 * Empty portfolio/gallery
 */
export function EmptyPortfolio({ 
  isOwnProfile = false,
  onUploadImages,
  onContactArtist,
  artistName,
  className 
}) {
  const title = isOwnProfile 
    ? "Your portfolio is empty"
    : `${artistName || "This artist"} hasn't uploaded any work yet`;

  const description = isOwnProfile
    ? "Upload your best tattoo work to showcase your skills and attract new clients."
    : "Check back soon to see their amazing tattoo work, or contact them directly for examples of their style.";

  const actions = isOwnProfile ? (
    <Button 
      variant="primary" 
      onClick={onUploadImages}
      size="md"
    >
      Upload Your Work
    </Button>
  ) : (
    onContactArtist && (
      <Button 
        variant="outline" 
        onClick={onContactArtist}
        size="md"
      >
        Contact Artist
      </Button>
    )
  );

  return (
    <EmptyState
      variant="portfolio"
      title={title}
      description={description}
      actions={actions}
      size="md"
      className={className}
    />
  );
}

/**
 * Loading state for empty content areas
 */
export function LoadingEmptyState({ 
  message = "Loading amazing content...",
  className 
}) {
  return (
    <EmptyState
      variant="loading"
      title="Just a moment"
      description={message}
      size="md"
      className={className}
    />
  );
}

/**
 * Generic empty state with custom content
 */
export function CustomEmptyState({
  variant = 'search',
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration,
  size = 'md',
  className
}) {
  const actions = (
    <>
      {primaryAction && (
        <Button 
          variant="primary" 
          onClick={primaryAction.onClick}
          size={primaryAction.size || 'md'}
        >
          {primaryAction.label}
        </Button>
      )}
      {secondaryAction && (
        <Button 
          variant="outline" 
          onClick={secondaryAction.onClick}
          size={secondaryAction.size || 'md'}
        >
          {secondaryAction.label}
        </Button>
      )}
    </>
  );

  return (
    <EmptyState
      variant={variant}
      title={title}
      description={description}
      illustration={illustration}
      actions={actions}
      size={size}
      className={className}
    />
  );
}

/**
 * Error state that looks like an empty state
 */
export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We're having trouble loading this content. Please try again.",
  onRetry,
  onGoHome,
  className
}) {
  const actions = (
    <>
      {onRetry && (
        <Button 
          variant="primary" 
          onClick={onRetry}
          size="md"
        >
          Try Again
        </Button>
      )}
      {onGoHome && (
        <Button 
          variant="outline" 
          onClick={onGoHome}
          size="md"
        >
          Go Home
        </Button>
      )}
    </>
  );

  return (
    <EmptyState
      variant="search" // Use search variant but with error styling
      title={title}
      description={description}
      actions={actions}
      size="md"
      className={className}
    />
  );
}

/**
 * No results for filtered content
 */
export function NoFilterResults({
  filterType = "filters",
  onClearFilters,
  onResetAll,
  activeFiltersCount = 0,
  className
}) {
  const title = `No results with current ${filterType}`;
  const description = activeFiltersCount > 0 
    ? `Try removing some ${filterType} to see more results.`
    : `Adjust your ${filterType} to find what you're looking for.`;

  const actions = (
    <>
      {onClearFilters && (
        <Button 
          variant="outline" 
          onClick={onClearFilters}
          size="md"
        >
          Clear {filterType}
        </Button>
      )}
      {onResetAll && (
        <Button 
          variant="primary" 
          onClick={onResetAll}
          size="md"
        >
          Show All Results
        </Button>
      )}
    </>
  );

  return (
    <EmptyState
      variant="search"
      title={title}
      description={description}
      actions={actions}
      size="md"
      className={className}
    />
  );
}