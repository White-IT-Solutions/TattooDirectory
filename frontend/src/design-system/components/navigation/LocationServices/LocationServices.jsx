/**
 * Location Services Component
 * 
 * Provides location-based functionality including geolocation,
 * distance calculation, and location-aware features.
 * 
 * Requirements: 8.6
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { locationServices, deviceCapabilities } from '../../../../lib/device-capabilities';
import TouchTarget from '../TouchTargets/TouchTargets';

const LocationServices = ({ 
  onLocationUpdate,
  onLocationError,
  showLocationButton = true,
  autoRequest = false,
  watchPosition = false,
  className = ''
}) => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  // Check geolocation permission status
  const checkPermission = useCallback(async () => {
    if (!deviceCapabilities.hasGeolocation()) {
      setHasPermission(false);
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setHasPermission(permission.state === 'granted');
      
      permission.addEventListener('change', () => {
        setHasPermission(permission.state === 'granted');
      });
    } catch (e) {
      // Fallback for browsers that don't support permissions API
      setHasPermission(null);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!deviceCapabilities.hasGeolocation()) {
      const error = new Error('Geolocation not supported');
      setError(error);
      onLocationError?.(error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await locationServices.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });

      setLocation(position);
      onLocationUpdate?.(position);
    } catch (error) {
      setError(error);
      onLocationError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onLocationUpdate, onLocationError]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!deviceCapabilities.hasGeolocation() || watchId) return;

    const id = locationServices.watchPosition(
      (position) => {
        setLocation(position);
        onLocationUpdate?.(position);
      },
      (error) => {
        setError(error);
        onLocationError?.(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );

    setWatchId(id);
  }, [watchId, onLocationUpdate, onLocationError]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId) {
      locationServices.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Initialize location services
  useEffect(() => {
    checkPermission();

    if (autoRequest) {
      getCurrentLocation();
    }

    if (watchPosition) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [autoRequest, watchPosition, checkPermission, getCurrentLocation, startWatching, stopWatching]);

  // Format location for display
  const formatLocation = (loc) => {
    if (!loc) return null;
    
    return {
      coordinates: `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
      accuracy: `±${Math.round(loc.accuracy)}m`,
      timestamp: new Date(loc.timestamp).toLocaleTimeString()
    };
  };

  // Calculate distance to a point
  const calculateDistanceTo = useCallback((targetLat, targetLon) => {
    if (!location) return null;
    
    const distance = locationServices.calculateDistance(
      location.latitude,
      location.longitude,
      targetLat,
      targetLon
    );
    
    return locationServices.formatDistance(distance);
  }, [location]);

  return (
    <div className={`location-services ${className}`}>
      {/* Location button */}
      {showLocationButton && (
        <TouchTarget
          size="comfortable"
          onClick={getCurrentLocation}
          disabled={isLoading || !deviceCapabilities.hasGeolocation()}
          className="location-button"
          style={{
            backgroundColor: location ? '#10b981' : '#6b7280',
            color: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          aria-label="Get current location"
        >
          <span style={{ fontSize: '16px' }}>
            {isLoading ? '⏳' : location ? '📍' : '📍'}
          </span>
          <span style={{ fontSize: '14px' }}>
            {isLoading ? 'Getting location...' : location ? 'Location found' : 'Get location'}
          </span>
        </TouchTarget>
      )}

      {/* Location display */}
      {location && (
        <div 
          className="location-display"
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
            Current Location
          </div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>
            {formatLocation(location)?.coordinates}
          </div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>
            Accuracy: {formatLocation(location)?.accuracy}
          </div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>
            Updated: {formatLocation(location)?.timestamp}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div 
          className="location-error"
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>
            Location Error
          </div>
          <div style={{ fontSize: '12px', color: '#dc2626' }}>
            {error.message}
          </div>
          {error.message.includes('denied') && (
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
              Please enable location access in your browser settings.
            </div>
          )}
        </div>
      )}

      {/* Permission status */}
      {hasPermission === false && (
        <div 
          className="location-permission"
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fffbeb',
            borderRadius: '8px',
            border: '1px solid #fed7aa'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#d97706', marginBottom: '4px' }}>
            Location Permission Required
          </div>
          <div style={{ fontSize: '12px', color: '#d97706' }}>
            Enable location access to find nearby artists and studios.
          </div>
        </div>
      )}

      {/* Watch position controls */}
      {deviceCapabilities.hasGeolocation() && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <TouchTarget
            size="minimum"
            onClick={watchPosition ? stopWatching : startWatching}
            className="watch-button"
            style={{
              backgroundColor: watchId ? '#dc2626' : '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '6px 12px'
            }}
          >
            {watchId ? 'Stop tracking' : 'Track location'}
          </TouchTarget>
        </div>
      )}
    </div>
  );
};

// Hook for using location services
export const useLocationServices = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await locationServices.getCurrentPosition();
      setLocation(position);
      return position;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateDistance = useCallback((targetLat, targetLon) => {
    if (!location) return null;
    return locationServices.calculateDistance(
      location.latitude,
      location.longitude,
      targetLat,
      targetLon
    );
  }, [location]);

  const formatDistance = useCallback((km, useMetric = true) => {
    return locationServices.formatDistance(km, useMetric);
  }, []);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    calculateDistance,
    formatDistance,
    hasGeolocation: deviceCapabilities.hasGeolocation()
  };
};

export default LocationServices;