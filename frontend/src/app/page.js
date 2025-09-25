"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Button,
  SearchInput
} from '../design-system/components/ui';
import { PageWrapper } from '../design-system/components/layout';
import ArtistCard from './components/ArtistCard';
import { mockArtistData } from './data/mockArtistData';
import { ArtistCardSkeleton } from '../design-system/components/ui/Skeleton/ArtistCardSkeleton';
import SearchFeedbackIntegration from '../design-system/components/feedback/SearchFeedbackIntegration/SearchFeedbackIntegration';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  
  // Get featured artists (first 6 with high ratings)
  const featuredArtists = mockArtistData
    .filter(artist => artist.rating >= 4.2)
    .slice(0, 6);

  // Handle search from home page
  const handleSearch = async (query, options) => {
    // Navigate to search page with query
    router.push(`/search?q=${encodeURIComponent(query)}`);
    
    // Return success for feedback
    return {
      success: true,
      message: `Searching for "${query}"...`
    };
  };

  return (
    <PageWrapper
      title="Tattoo Directory"
      description="Discover exceptional tattoo artists across the UK. Connect with talented artists, explore diverse styles, and find the perfect match for your next tattoo."
      showPageHeader={false}
      maxWidth="full"
      contentPadding="none"
    >
      <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[var(--background-primary)] via-[var(--background-secondary)] to-[var(--background-tertiary)] py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="font-family-brand text-[var(--typography-heading-1-size)] md:text-[4rem] lg:text-[5rem] font-[var(--typography-heading-1-weight)] text-[var(--interactive-primary)] mb-6 leading-[var(--typography-heading-1-line-height)]">
            Tattoo Directory
          </h1>
          
          {/* Subheading */}
          <h2 className="font-family-heading text-[var(--typography-heading-3-size)] md:text-[var(--typography-heading-2-size)] font-[var(--typography-heading-3-weight)] text-[var(--text-secondary)] mb-8 leading-[var(--typography-heading-3-line-height)]">
            Discover exceptional tattoo artists across the UK
          </h2>
          
          {/* Description */}
          <p className="text-[var(--typography-body-large-size)] text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-[var(--typography-body-large-line-height)]">
            Connect with talented artists, explore diverse styles, and find the perfect match for your next tattoo. From traditional to contemporary, discover artists who bring your vision to life.
          </p>

          {/* Enhanced Search Section */}
          <Card elevation="high" padding="lg" className="max-w-2xl mx-auto mb-8">
            <CardContent>
              <div className="space-y-4">
                <SearchFeedbackIntegration
                  searchType="general"
                  placeholder="Search artists, styles, or locations..."
                  size="lg"
                  onSearch={handleSearch}
                  enableValidation={true}
                  enableProgress={true}
                  enableErrorHandling={true}
                  showSuggestions={true}
                  showPopularSearches={true}
                  progressSteps={[
                    'Validating search',
                    'Finding matches',
                    'Loading results',
                    'Complete'
                  ]}
                />
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/artists">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto">
                      Browse All Artists
                    </Button>
                  </Link>
                  <Link href="/studios">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Find Studios
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card elevation="medium" padding="md" className="text-center">
              <CardContent>
                <div className="text-[var(--typography-heading-2-size)] font-[var(--typography-heading-2-weight)] text-[var(--interactive-primary)] mb-2">
                  {mockArtistData.length}+
                </div>
                <div className="text-[var(--typography-body-size)] text-[var(--text-secondary)]">
                  Verified Artists
                </div>
              </CardContent>
            </Card>
            
            <Card elevation="medium" padding="md" className="text-center">
              <CardContent>
                <div className="text-[var(--typography-heading-2-size)] font-[var(--typography-heading-2-weight)] text-[var(--interactive-primary)] mb-2">
                  {[...new Set(mockArtistData.flatMap(artist => artist.styles))].length}+
                </div>
                <div className="text-[var(--typography-body-size)] text-[var(--text-secondary)]">
                  Tattoo Styles
                </div>
              </CardContent>
            </Card>
            
            <Card elevation="medium" padding="md" className="text-center">
              <CardContent>
                <div className="text-[var(--typography-heading-2-size)] font-[var(--typography-heading-2-weight)] text-[var(--interactive-primary)] mb-2">
                  {[...new Set(mockArtistData.map(artist => artist.locationDisplay?.split(',')[1]?.trim() || 'UK'))].length}+
                </div>
                <div className="text-[var(--typography-body-size)] text-[var(--text-secondary)]">
                  UK Cities
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Artists Section */}
      <section className="py-16 px-4 bg-[var(--background-secondary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-family-heading text-[var(--typography-heading-2-size)] font-[var(--typography-heading-2-weight)] text-[var(--text-primary)] mb-4">
              Featured Artists
            </h2>
            <p className="text-[var(--typography-body-large-size)] text-[var(--text-secondary)] max-w-2xl mx-auto">
              Discover some of our highest-rated artists, each bringing unique skills and artistic vision to their craft.
            </p>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArtistCardSkeleton key={i} />
              ))}
            </div>
          }>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredArtists.map((artist) => (
                <ArtistCard key={artist.artistId} artist={artist} />
              ))}
            </div>
          </Suspense>

          <div className="text-center">
            <Link href="/artists">
              <Button variant="accent" size="lg">
                View All Artists
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Styles Section */}
      <section className="py-16 px-4 bg-[var(--background-primary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-family-heading text-[var(--typography-heading-2-size)] font-[var(--typography-heading-2-weight)] text-[var(--text-primary)] mb-4">
              Popular Tattoo Styles
            </h2>
            <p className="text-[var(--typography-body-large-size)] text-[var(--text-secondary)] max-w-2xl mx-auto">
              Explore the most sought-after tattoo styles and find artists who specialize in your preferred aesthetic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { 
                style: 'Traditional', 
                description: 'Bold lines and classic imagery',
                count: mockArtistData.filter(a => a.styles.includes('traditional')).length,
                color: 'var(--interactive-primary)'
              },
              { 
                style: 'Realism', 
                description: 'Photorealistic and detailed work',
                count: mockArtistData.filter(a => a.styles.includes('realism')).length,
                color: 'var(--interactive-accent)'
              },
              { 
                style: 'Geometric', 
                description: 'Precise patterns and sacred geometry',
                count: mockArtistData.filter(a => a.styles.includes('geometric')).length,
                color: 'var(--feedback-success)'
              },
              { 
                style: 'Watercolour', 
                description: 'Flowing colors and artistic flair',
                count: mockArtistData.filter(a => a.styles.includes('watercolour')).length,
                color: 'var(--feedback-warning)'
              }
            ].map((styleInfo) => (
              <Link key={styleInfo.style} href={`/artists?styles=${styleInfo.style.toLowerCase()}`}>
                <Card elevation="medium" padding="md" className="h-full hover:elevation-high transition-all duration-200 cursor-pointer group">
                  <CardContent className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: styleInfo.color }}
                    >
                      {styleInfo.count}
                    </div>
                    <h3 className="font-[var(--typography-heading-4-weight)] text-[var(--typography-heading-4-size)] text-[var(--text-primary)] mb-2 group-hover:text-[var(--interactive-primary)] transition-colors">
                      {styleInfo.style}
                    </h3>
                    <p className="text-[var(--typography-body-small-size)] text-[var(--text-secondary)]">
                      {styleInfo.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/artists">
              <Button variant="outline" size="lg">
                Explore All Styles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[var(--interactive-primary)] to-[var(--interactive-accent)]">
        <div className="max-w-4xl mx-auto text-center">
          <Card elevation="floating" padding="lg" className="bg-[var(--background-primary)]">
            <CardHeader>
              <CardTitle className="text-[var(--typography-heading-2-size)] font-[var(--typography-heading-2-weight)] text-[var(--text-primary)] mb-4">
                Ready to Find Your Perfect Artist?
              </CardTitle>
              <CardDescription className="text-[var(--typography-body-large-size)] text-[var(--text-secondary)] mb-8">
                Join thousands of satisfied clients who found their ideal tattoo artist through our platform. 
                Start your journey to exceptional ink today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/artists">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Start Browsing Artists
                  </Button>
                </Link>
                <Link href="/studios">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto">
                    Find Local Studios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      </div>
    </PageWrapper>
  );
}
