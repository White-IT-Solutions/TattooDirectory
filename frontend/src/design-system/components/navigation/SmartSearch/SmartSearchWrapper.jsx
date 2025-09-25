"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import EnhancedSmartSearch to prevent SSR issues
const EnhancedSmartSearch = dynamic(() => import('./EnhancedSmartSearch'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-10 bg-[var(--background-muted)] rounded-md animate-pulse" />
  )
});

// Fallback to regular SmartSearch if EnhancedSmartSearch fails
const SmartSearch = dynamic(() => import('./SmartSearch'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-10 bg-[var(--background-muted)] rounded-md animate-pulse" />
  )
});

export default function SmartSearchWrapper(props) {
  return (
    <Suspense fallback={<div className="w-full h-10 bg-[var(--background-muted)] rounded-md animate-pulse" />}>
      <EnhancedSmartSearch {...props} />
    </Suspense>
  );
}