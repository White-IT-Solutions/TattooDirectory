"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Lazy load StyleGallery component
const StyleGallery = React.lazy(() => import("../../../design-system/components/ui/StyleGallery/StyleGallery"));
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
  ContactOptions,
  StudioCardSkeleton,
  StudioArtists
} from '../../../design-system';

// Data Visualization Components
import {
  BarChart,
  LineChart,
  DonutChart,
  TrendIndicator,
  MetricCard
} from '../../../design-system/components/ui/DataVisualization';

// Empty State Components
import { 
  EmptyPortfolio, 
  ErrorEmptyState,
  LoadingEmptyState 
} from '../../../design-system/components/feedback/EmptyState';

import { mockStudios } from '../../data/mockStudioData';
import { mockArtistData } from '../../data/mockArtistData';

/**
 * StudioProfile Page Component
 * 
 * Displays comprehensive studio information including:
 * - Studio details, contact info, and opening hours
 * - List of all artists working at the studio
 * - Studio gallery/images
 * - Map integration for studio location
 * 
 * Requirements: 1.3, 6.2, 11.1
 */
export const dynamic = 'force-dynamic';

export default function StudioProfilePage() {
  const params = useParams();
  const studioId = params?.studioId;
  
  const [studio, setStudio] = useState(null);
  const [studioArtists, setStudioArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studioId) return;

    try {
      // Find studio by ID
      const foundStudio = mockStudios.find(s => s.studioId === studioId);
      
      if (!foundStudio) {
        setError('Studio not found');
        setLoading(false);
        return;
      }

      // Find artists working at this studio
      const artists = mockArtistData.filter(artist => 
        artist.tattooStudio?.studioId === studioId
      );

      setStudio(foundStudio);
      setStudioArtists(artists);
      setLoading(false);
    } catch (err) {
      // console.error('Error loading studio:', err);
      setError('Failed to load studio information');
      setLoading(false);
    }
  }, [studioId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingEmptyState message="Loading studio information..." />
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorEmptyState
          title={error || 'Studio not found'}
          description="The studio you're looking for doesn't exist or has been removed."
          onGoHome={() => window.location.href = "/studios"}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-subtle)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Studio Header */}
        <StudioHeader studio={studio} />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Studio Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Studio Information */}
            <StudioInformation studio={studio} />
            
            {/* Studio Gallery */}
            <StudioGallery studio={studio} />
            
            {/* Enhanced Studio Portfolio Gallery */}
            <StudioPortfolioGallery studio={studio} />
            
            {/* Studio Analytics & Statistics */}
            <Card elevation="medium" padding="lg">
              <CardHeader>
                <CardTitle>Studio Analytics & Performance</CardTitle>
                <CardDescription>
                  Key metrics and performance indicators for {studio.studioName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Studio Metric Cards */}
                  <MetricCard
                    title="Total Artists"
                    value={studioArtists.length}
                    change={2}
                    trend="up"
                    subtitle="Active artists"
                    icon="👥"
                  />
                  
                  <MetricCard
                    title="Studio Rating"
                    value={studio.rating || 4.6}
                    change={0.1}
                    trend="up"
                    subtitle={`${studio.reviewCount || 0} reviews`}
                    icon="⭐"
                  />
                  
                  <MetricCard
                    title="Years Established"
                    value={new Date().getFullYear() - (studio.established || 2015)}
                    subtitle="Years in business"
                    icon="🏢"
                  />
                  
                  <MetricCard
                    title="Monthly Bookings"
                    value={studio.monthlyBookings || 85}
                    change={12}
                    trend="up"
                    subtitle="Average per month"
                    icon="📅"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Artist Specialties Distribution */}
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                      Artist Specialties
                    </h4>
                    <DonutChart
                      data={[
                        { label: 'Traditional', value: 30, color: '#8B5CF6' },
                        { label: 'Realism', value: 25, color: '#06B6D4' },
                        { label: 'Japanese', value: 20, color: '#10B981' },
                        { label: 'Blackwork', value: 15, color: '#374151' },
                        { label: 'Other', value: 10, color: '#F59E0B' }
                      ]}
                      size={200}
                      showLabels={true}
                    />
                  </div>

                  {/* Monthly Revenue Trend */}
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                      Booking Trends (6 Months)
                    </h4>
                    <LineChart
                      data={[
                        { x: 'Jul', y: 75 },
                        { x: 'Aug', y: 82 },
                        { x: 'Sep', y: 88 },
                        { x: 'Oct', y: 95 },
                        { x: 'Nov', y: 91 },
                        { x: 'Dec', y: 105 }
                      ]}
                      height={200}
                      color="#10B981"
                      showDots={true}
                    />
                  </div>

                  {/* Artist Performance Comparison */}
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                      Artist Performance
                    </h4>
                    <BarChart
                      data={studioArtists.slice(0, 5).map((artist, index) => ({
                        label: artist.artistName?.split(' ')[0] || `Artist ${index + 1}`,
                        value: artist.rating ? artist.rating * 20 : 80 + Math.random() * 20
                      }))}
                      height={200}
                      color="#8B5CF6"
                      showValues={false}
                    />
                  </div>

                  {/* Studio Performance Indicators */}
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                      Performance Metrics
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">Average Response Time</span>
                        <TrendIndicator value={1.8} trend="down" label="hours" size="sm" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">Booking Conversion</span>
                        <TrendIndicator value={78.5} trend="up" size="sm" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">Customer Retention</span>
                        <TrendIndicator value={85.2} trend="up" size="sm" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">Studio Utilization</span>
                        <TrendIndicator value={92.1} trend="neutral" size="sm" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">Quality Score</span>
                        <TrendIndicator value={4.7} trend="up" label="/5" size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Artists at Studio */}
            <StudioArtists 
              artists={studioArtists} 
              studioName={studio.studioName}
              showFilters={true}
              gridCols="2"
              cardSize="md"
            />
          </div>
          
          {/* Right Column - Contact & Location */}
          <div className="space-y-6">
            {/* Contact Information */}
            <StudioContact studio={studio} />
            
            {/* Opening Hours */}
            <StudioHours studio={studio} />
            
            {/* Location Map */}
            <StudioLocation studio={studio} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Studio Header Component
 */
function StudioHeader({ studio }) {
  return (
    <Card elevation="medium" padding="lg">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Studio Logo/Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={studio.avatar || '/placeholder-studio.svg'}
            alt={`${studio.studioName} logo`}
            width={120}
            height={120}
            className="rounded-xl object-cover border-2 border-[var(--border-secondary)]"
            onError={(e) => {
              e.target.src = '/placeholder-studio.svg';
            }}
          />
        </div>
        
        <div className="flex-1">
          {/* Studio Name */}
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2" data-testid="studio-name">
            {studio.studioName}
          </h1>
          
          {/* Location */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📍</span>
            <span className="text-lg text-[var(--text-secondary)]" data-testid="studio-location">
              {studio.locationDisplay}
            </span>
          </div>
          
          {/* Rating and Reviews */}
          {studio.rating > 0 && (
            <div className="mb-4">
              <StarRating 
                rating={studio.rating} 
                reviewCount={studio.reviewCount}
                size="lg"
              />
            </div>
          )}
          
          {/* Studio Stats */}
          <div className="flex flex-wrap gap-4">
            <Badge variant="primary" size="md" data-testid="artist-count">
              {studio.artists?.length || studio.artistCount || 0} Artists
            </Badge>
            {studio.established && (
              <Badge variant="secondary" size="md" data-testid="established-year">
                Est. {studio.established}
              </Badge>
            )}
            <Badge variant="accent" size="md" data-testid="specialties-count">
              {studio.specialties?.length || 0} Specialties
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Studio Information Component
 */
function StudioInformation({ studio }) {
  return (
    <Card elevation="medium" padding="lg">
      <CardHeader>
        <CardTitle>About {studio.studioName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Studio Description */}
        <div>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {studio.description || `${studio.studioName} is a professional tattoo studio located in ${studio.locationDisplay}. We specialize in various tattoo styles and are committed to providing high-quality artwork in a clean, safe environment.`}
          </p>
        </div>
        
        {/* Specialties */}
        {studio.specialties && studio.specialties.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Specialties
            </h3>
            <div className="flex flex-wrap gap-2">
              {studio.specialties.map((specialty, index) => (
                <Tag
                  key={specialty + index}
                  variant="primary"
                  size="md"
                >
                  {specialty}
                </Tag>
              ))}
            </div>
          </div>
        )}
        
        {/* Studio Features */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Studio Features
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span>✅</span>
              <span>Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span>✅</span>
              <span>Sterile Equipment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span>✅</span>
              <span>Custom Designs</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span>✅</span>
              <span>Consultations</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span>✅</span>
              <span>Aftercare Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span>✅</span>
              <span>Walk-ins Welcome</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Studio Gallery Component
 */
function StudioGallery({ studio }) {
  if (!studio.galleryImages || studio.galleryImages.length === 0) {
    return null;
  }

  return (
    <Card elevation="medium" padding="lg">
      <CardHeader>
        <CardTitle>Studio Gallery</CardTitle>
        <CardDescription>
          Take a look inside {studio.studioName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {studio.galleryImages.map((image, index) => {
            const imgSrc = typeof image === 'string' ? image : image?.url;
            return imgSrc ? (
              <div key={index} className="aspect-square relative overflow-hidden rounded-lg group">
                <Image
                  src={imgSrc}
                  alt={`${studio.studioName} gallery ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
              </div>
            ) : null;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Studio Portfolio Gallery Component with StyleGallery Integration
 */
function StudioPortfolioGallery({ studio }) {
  return (
    <Card elevation="medium" padding="lg">
      <CardHeader>
        <CardTitle>Studio Portfolio</CardTitle>
        <CardDescription>
          Browse tattoo work from all artists at {studio.studioName} with advanced filtering and lightbox viewing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-neutral-600">Loading studio portfolio...</span>
          </div>
        }>
          <StyleGallery
            studioId={studio.studioId}
            showFilters={true}
            maxImages={40}
            columns={4}
            lazyLoading={true}
            enableLightbox={true}
            enableSearch={true}
            enableMotifFiltering={true}
            enableCharacteristicFiltering={true}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}



/**
 * Studio Contact Component
 */
function StudioContact({ studio }) {
  return (
    <Card elevation="medium" padding="lg">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <ContactOptions
          contactInfo={studio.contactInfo}
          size="md"
          showLabels={true}
          vertical={true}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Studio Hours Component
 */
function StudioHours({ studio }) {
  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ];
  
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  return (
    <Card elevation="medium" padding="lg">
      <CardHeader>
        <CardTitle>Opening Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {daysOfWeek.map((day) => {
            const hours = studio.openingHours?.[day] || 'Closed';
            const isToday = day === today;
            
            return (
              <div 
                key={day}
                className={`flex justify-between items-center py-2 px-3 rounded-md ${
                  isToday ? 'bg-[var(--background-accent)] border border-[var(--border-accent)]' : ''
                }`}
              >
                <span className={`font-medium ${
                  isToday ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}>
                  {dayLabels[day]}
                  {isToday && <span className="ml-2 text-xs">(Today)</span>}
                </span>
                <span className={`${
                  isToday ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'
                } ${hours === 'Closed' ? 'text-[var(--text-tertiary)]' : ''}`}>
                  {hours}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Studio Location Component with Map Integration
 */
function StudioLocation({ studio }) {
  const address = studio.address;
  const fullAddress = address ? 
    `${address.street}, ${address.city}, ${address.postcode}` : 
    studio.locationDisplay;

  // Google Maps URL for directions
  const mapsUrl = address?.latitude && address?.longitude ?
    `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}` :
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // Static map URL (using a placeholder service)
  const staticMapUrl = address?.latitude && address?.longitude ?
    `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-building+5c475c(${address.longitude},${address.latitude})/${address.longitude},${address.latitude},15,0/400x300@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw` :
    '/placeholder-map.svg';

  return (
    <Card elevation="medium" padding="lg">
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div>
          <div className="flex items-start gap-2">
            <span className="text-lg mt-1">📍</span>
            <div>
              <p className="text-[var(--text-primary)] font-medium">
                {studio.studioName}
              </p>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {fullAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Map Preview */}
        <div className="relative aspect-video rounded-lg overflow-hidden border border-[var(--border-secondary)]">
          <Image
            src={staticMapUrl}
            alt={`Map showing ${studio.studioName} location`}
            fill
            className="object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-map.svg';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="primary" size="md" className="w-full">
              Get Directions
            </Button>
          </a>
          
          {studio.contactInfo?.phone && (
            <a
              href={`tel:${studio.contactInfo.phone}`}
              className="block"
            >
              <Button variant="outline" size="md" className="w-full">
                Call Studio
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading Skeleton for Studio Profile
 */
function StudioProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background-subtle)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <StudioCardSkeleton />
        
        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <StudioCardSkeleton />
            <StudioCardSkeleton />
            <StudioCardSkeleton />
          </div>
          <div className="space-y-6">
            <StudioCardSkeleton />
            <StudioCardSkeleton />
            <StudioCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}