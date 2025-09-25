"use client";

import React, { Suspense } from 'react';

export const dynamic = 'force-dynamic';

// Import the enhanced Studios page
const EnhancedStudiosPage = React.lazy(() => import('./EnhancedStudiosPage'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading studios...</span>
  </div>
);

/**
 * Studios Listing Page Component
 * 
 * Enhanced studios page with comprehensive search functionality including:
 * - Studio-specific search with specialty filtering
 * - Enhanced style filter with studio-relevant metadata
 * - Search suggestions with studio characteristics
 * - Map integration with search functionality
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */
export default function StudiosPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EnhancedStudiosPage />
    </Suspense>
  );
}
