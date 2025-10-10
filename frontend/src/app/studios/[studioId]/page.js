import React, { Suspense } from 'react';
import StudioProfileClient from './StudioProfileClient';
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

// Generate static params for all studios
export async function generateStaticParams() {
  // Import mock data for static generation
  const { mockStudios } = await import('../../data/mockStudioData');
  
  return mockStudios.map((studio) => ({
    studioId: studio.studioId,
  }));
}

export default function StudioProfilePage() {
  return <StudioProfileClient />;
}

