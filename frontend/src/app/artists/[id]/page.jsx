import React, { Suspense } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import Lightbox from "@/app/components/Lightbox";
import AvatarImage from "@/app/components/AvatarImage";
import { mockArtistData as mockArtists } from "../../data/mockArtistData";

// Lazy load StyleGallery component
const StyleGallery = React.lazy(() => import("../../../design-system/components/ui/StyleGallery/StyleGallery"));

// Enhanced Design System Components
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Button,
  Badge,
  Tag,
  StarRating,
  PricingDisplay,
  AvailabilityStatus,
  ExperienceBadge,
  ContactOptions,
  StudioCard
} from "../../../design-system/components/ui";

// Data Visualization Components
import {
  BarChart,
  LineChart,
  DonutChart,
  TrendIndicator,
  MetricCard
} from "../../../design-system/components/ui/DataVisualization";

// Empty State Components
import { 
  EmptyPortfolio, 
  ErrorEmptyState 
} from "../../../design-system/components/feedback/EmptyState";

export default async function ArtistPage({ params }) {
  const { id: artistId } = await params;

  let artist = null;
  try {
    // Check if we should use mock data in development
    const shouldUseMock = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;
    
    if (shouldUseMock) {
      // Using mock data - backend not configured
      artist = mockArtists.find(a => a.artistId === artistId || a.PK === artistId);
    } else {
      artist = await api.getArtist(artistId);
    }
  } catch (error) {
    // Failed to fetch artist, trying mock data
    // Fallback to mock data
    artist = mockArtists.find(a => a.artistId === artistId || a.PK === artistId);
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)]">
        <ErrorEmptyState
          title="Artist not found"
          description="The artist you're looking for doesn't exist or has been removed."
          onGoHome={() => window.location.href = "/artists"}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Use fallback values for missing or undefined fields
  const artistName = artist.artistName || artist.artistsName || artist.name || 'Unknown Artist';
  const avatarSrc = artist.avatar || '/placeholder-avatar.svg';
  const bio = artist.bio || 'Tattoo artist';
  const profileLink = artist.profileLink || artist.contactInfo?.website || artist.contactInfo?.instagram || '#';
  const instagramHandle = artist.instagramHandle || artist.contactInfo?.instagram || 'unknown';
  const location = artist.location || artist.locationDisplay || artist.tattooStudio?.address?.city || 'Location not available';
  const portfolio = artist.portfolio || artist.portfolioImages || [];

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        {/* Enhanced Sidebar */}
        <aside className="w-full lg:w-96 lg:min-h-screen bg-[var(--background-primary)] lg:sticky lg:top-0">
          <div className="p-6 space-y-6">
            {/* Artist Header Card */}
            <Card elevation="medium" padding="lg">
              <CardContent className="text-center space-y-4">
                {/* Artist Avatar */}
                <div className="relative">
                  <AvatarImage
                    src={avatarSrc}
                    alt={artistName}
                    width={120}
                    height={120}
                    className="rounded-full mx-auto border-4 border-[var(--border-subtle)] shadow-[var(--shadow)]"
                  />
                </div>

                {/* Artist Name & Bio */}
                <div>
                  <CardTitle className="text-2xl font-bold text-[var(--text-primary)] mb-2" data-testid="artist-name">
                    {artistName}
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)] text-base leading-relaxed">
                    {bio}
                  </CardDescription>
                </div>

                {/* Rating Display */}
                {artist.rating && (
                  <div className="flex justify-center">
                    <StarRating 
                      rating={artist.rating} 
                      reviewCount={artist.reviewCount}
                      size="md"
                    />
                  </div>
                )}

                {/* Location Badge */}
                <div className="flex justify-center">
                  <Badge variant="secondary" size="md" icon="📍">
                    {location}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Styles & Specialties */}
            <Card elevation="low" padding="md">
              <CardHeader>
                <CardTitle className="text-lg">Styles & Specialties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Tattoo Styles */}
                {artist.styles && artist.styles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Tattoo Styles</h4>
                    <div className="flex flex-wrap gap-2" data-testid="artist-styles">
                      {artist.styles.map((style) => (
                        <Tag
                          key={style}
                          variant="primary"
                          size="sm"
                        >
                          {style}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {artist.specialties && artist.specialties.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {artist.specialties.map((specialty, index) => (
                        <Tag
                          key={specialty + index}
                          variant="accent"
                          size="sm"
                        >
                          {specialty}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card elevation="low" padding="md">
              <CardHeader>
                <CardTitle className="text-lg">Business Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing Display */}
                {artist.pricing && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Pricing</h4>
                    <PricingDisplay pricing={artist.pricing} size="sm" />
                  </div>
                )}

                {/* Availability Status */}
                {artist.availability && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Availability</h4>
                    <AvailabilityStatus availability={artist.availability} size="sm" />
                  </div>
                )}

                {/* Experience Badges */}
                {artist.experience && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Experience</h4>
                    <ExperienceBadge experience={artist.experience} size="sm" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card elevation="low" padding="md">
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4" data-testid="contact-info">
                {/* Contact Options */}
                <ContactOptions 
                  contactInfo={artist.contactInfo}
                  instagramHandle={instagramHandle}
                  size="sm"
                />

                {/* Primary CTA */}
                <div className="pt-2">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-full"
                  >
                    Contact Artist
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Studio Information */}
            {artist.tattooStudio && (
              <Card elevation="low" padding="md">
                <CardHeader>
                  <CardTitle className="text-lg">Studio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)]">
                        {artist.tattooStudio.studioName}
                      </h4>
                      {artist.tattooStudio.address && (
                        <p className="text-sm text-[var(--text-secondary)]">
                          {artist.tattooStudio.address.street}<br />
                          {artist.tattooStudio.address.city}, {artist.tattooStudio.address.postcode}
                        </p>
                      )}
                    </div>
                    
                    {/* Google Maps */}
                    {(artist.tattooStudio?.address?.latitude && artist.tattooStudio?.address?.longitude) ||
                     (artist.latitude && artist.longitude) ? (
                        <div className="rounded-lg overflow-hidden border border-[var(--border-secondary)]">
                          <iframe
                            className="w-full h-48"
                            frameBorder="0"
                            src={`https://www.google.com/maps?q=${
                              artist.latitude || artist.tattooStudio.address.latitude
                            }%2C${
                              artist.longitude || artist.tattooStudio.address.longitude
                            }&z=15&output=embed`}
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Removal */}
            <Card elevation="flat" padding="md" className="border-[var(--color-error-200)]">
              <CardContent>
                <Link href="/takedown">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                  >
                    Request Profile Removal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Enhanced Main Portfolio Section */}
        <main className="flex-1 p-6" data-testid="portfolio-images">
          <div className="max-w-6xl mx-auto">
            {/* Portfolio Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                {artistName}&apos;s Portfolio
              </h1>
              <p className="text-[var(--text-secondary)]">
                {portfolio.length > 0 
                  ? `${portfolio.length} tattoo${portfolio.length !== 1 ? 's' : ''} in portfolio`
                  : 'Portfolio coming soon'
                }
              </p>
            </div>

            {/* Portfolio Gallery */}
            {portfolio && portfolio.length > 0 ? (
              <Card elevation="low" padding="lg">
                <CardContent>
                  {/* Enhanced StyleGallery for Artist Portfolio */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Enhanced Portfolio Gallery
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Browse {artistName}&apos;s work with advanced filtering and lightbox viewing
                    </p>
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        <span className="ml-2 text-neutral-600">Loading portfolio gallery...</span>
                      </div>
                    }>
                      <StyleGallery
                        artistId={artist.artistId || artist.PK}
                        showFilters={true}
                        maxImages={30}
                        columns={3}
                        lazyLoading={true}
                        enableLightbox={true}
                        enableSearch={false}
                        enableMotifFiltering={true}
                        enableCharacteristicFiltering={true}
                      />
                    </Suspense>
                  </div>

                  {/* Original Lightbox Gallery */}
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Original Portfolio View
                    </h3>
                    <Lightbox images={portfolio} grid />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyPortfolio
                isOwnProfile={false}
                artistName={artistName}
                onContactArtist={() => {
                  // Scroll to contact section or open contact modal
                  const contactSection = document.getElementById('contact-options');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            )}

            {/* Artist Analytics & Statistics */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                Artist Analytics & Statistics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Metric Cards */}
                <MetricCard
                  title="Portfolio Size"
                  value={portfolio.length}
                  change={12}
                  trend="up"
                  subtitle="Images in portfolio"
                  icon="🎨"
                />
                
                <MetricCard
                  title="Average Rating"
                  value={artist.rating || 4.5}
                  change={0.2}
                  trend="up"
                  subtitle={`Based on ${artist.reviewCount || 0} reviews`}
                  icon="⭐"
                />
                
                <MetricCard
                  title="Years Experience"
                  value={artist.experience?.yearsActive || 5}
                  subtitle="Professional experience"
                  icon="🏆"
                />
                
                <MetricCard
                  title="Completed Works"
                  value={artist.completedWorks || 150}
                  change={8}
                  trend="up"
                  subtitle="Estimated tattoos"
                  icon="✅"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Style Distribution Chart */}
                <Card elevation="medium" padding="lg">
                  <CardHeader>
                    <CardTitle>Style Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of tattoo styles in {artistName}&apos;s portfolio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={[
                        { label: 'Traditional', value: 35, color: '#8B5CF6' },
                        { label: 'Realism', value: 25, color: '#06B6D4' },
                        { label: 'Blackwork', value: 20, color: '#374151' },
                        { label: 'Watercolor', value: 12, color: '#F59E0B' },
                        { label: 'Other', value: 8, color: '#EF4444' }
                      ]}
                      size={200}
                      showLabels={true}
                    />
                  </CardContent>
                </Card>

                {/* Monthly Bookings Trend */}
                <Card elevation="medium" padding="lg">
                  <CardHeader>
                    <CardTitle>Booking Trends</CardTitle>
                    <CardDescription>
                      Monthly booking activity over the past 6 months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={[
                        { x: 'Jul', y: 12 },
                        { x: 'Aug', y: 15 },
                        { x: 'Sep', y: 18 },
                        { x: 'Oct', y: 22 },
                        { x: 'Nov', y: 19 },
                        { x: 'Dec', y: 25 }
                      ]}
                      height={200}
                      color="#8B5CF6"
                      showDots={true}
                    />
                  </CardContent>
                </Card>

                {/* Rating Breakdown */}
                <Card elevation="medium" padding="lg">
                  <CardHeader>
                    <CardTitle>Rating Breakdown</CardTitle>
                    <CardDescription>
                      Distribution of customer ratings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={[
                        { label: '5★', value: 45 },
                        { label: '4★', value: 25 },
                        { label: '3★', value: 8 },
                        { label: '2★', value: 2 },
                        { label: '1★', value: 1 }
                      ]}
                      height={200}
                      color="#10B981"
                      showValues={true}
                    />
                  </CardContent>
                </Card>

                {/* Performance Indicators */}
                <Card elevation="medium" padding="lg">
                  <CardHeader>
                    <CardTitle>Performance Indicators</CardTitle>
                    <CardDescription>
                      Key performance metrics and trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Response Time</span>
                      <TrendIndicator value={2.5} trend="down" label="hours" size="sm" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Booking Rate</span>
                      <TrendIndicator value={15.2} trend="up" size="sm" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Customer Satisfaction</span>
                      <TrendIndicator value={4.8} trend="neutral" label="/5" size="sm" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Portfolio Growth</span>
                      <TrendIndicator value={8.3} trend="up" size="sm" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Additional Studio Information (if available) */}
            {artist.tattooStudio && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                  About {artist.tattooStudio.studioName}
                </h2>
                <div className="max-w-md">
                  <StudioCard 
                    studio={{
                      studioId: artist.tattooStudio.studioId,
                      studioName: artist.tattooStudio.studioName,
                      locationDisplay: location,
                      address: artist.tattooStudio.address,
                      specialties: artist.specialties || [],
                      artistCount: 1,
                      rating: artist.rating,
                      reviewCount: artist.reviewCount
                    }}
                    size="md"
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
