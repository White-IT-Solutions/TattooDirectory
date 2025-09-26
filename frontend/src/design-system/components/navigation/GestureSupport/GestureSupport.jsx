/**
 * Gesture Support Component
 * 
 * Provides comprehensive gesture support for mobile navigation including
 * swipe gestures, pull-to-refresh, and touch-friendly interactions.
 * 
 * Requirements: 3.4, 8.1, 8.2, 8.3
 */

"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { deviceCapabilities } from '../../../../lib/device-capabilities';

const GestureSupport = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  onPullToRefresh,
  enableSwipeNavigation = true,
  enablePullToRefresh = false,
  swipeThreshold = 50,
  pullThreshold = 100,
  className = ""
}) => {
  const containerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const isPullingRef = useRef(false);
  const router = useRouter();

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (!deviceCapabilities.hasTouch()) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
    isPullingRef.current = false;
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!deviceCapabilities.hasTouch()) return;

    const touch = e.touches[0];
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };

    // Check for pull-to-refresh
    if (enablePullToRefresh && window.scrollY === 0) {
      const deltaY = touch.clientY - touchStartRef.current.y;
      if (deltaY > 0 && deltaY < pullThreshold) {
        isPullingRef.current = true;
        // Add visual feedback for pull-to-refresh
        if (containerRef.current) {
          containerRef.current.style.transform = `translateY(${deltaY * 0.5}px)`;
          containerRef.current.style.opacity = Math.max(0.7, 1 - deltaY / pullThreshold);
        }
      }
    }
  }, [enablePullToRefresh, pullThreshold]);

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    if (!deviceCapabilities.hasTouch()) return;

    const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
    const deltaY = touchMoveRef.current.y - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Reset pull-to-refresh visual feedback
    if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.opacity = '';
    }

    // Check for pull-to-refresh
    if (enablePullToRefresh && isPullingRef.current && Math.abs(deltaY) > pullThreshold) {
      onPullToRefresh?.();
      return;
    }

    // Check for swipe gestures (must be fast enough and far enough)
    if (deltaTime < 300 && Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      // Horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          // Swipe right
          if (enableSwipeNavigation) {
            router.back();
          }
          onSwipeRight?.(deltaX);
        } else {
          // Swipe left
          if (enableSwipeNavigation) {
            router.forward();
          }
          onSwipeLeft?.(Math.abs(deltaX));
        }
      } 
      // Vertical swipes
      else {
        if (deltaY > 0) {
          onSwipeDown?.(deltaY);
        } else {
          onSwipeUp?.(Math.abs(deltaY));
        }
      }
    }
  }, [
    enableSwipeNavigation, 
    enablePullToRefresh, 
    swipeThreshold, 
    pullThreshold,
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    onPullToRefresh,
    router
  ]);

  // Set up touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !deviceCapabilities.hasTouch()) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div 
      ref={containerRef}
      className={`gesture-support ${className}`}
      style={{
        touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal gestures
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out'
      }}
    >
      {children}
    </div>
  );
};

// Touch-friendly button component
export const TouchFriendlyButton = ({ children, ...props }) => (
  <button 
    {...props}
    style={{ 
      minHeight: '44px', 
      minWidth: '44px',
      ...props.style 
    }}
  >
    {children}
  </button>
);

// Gesture support hook
export const useGestureSupport = () => {
  return {
    isTouch: deviceCapabilities.hasTouch(),
    isMobile: deviceCapabilities.isMobile(),
    supportsGestures: true
  };
};

export { GestureSupport };
export default GestureSupport;