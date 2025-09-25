/**
 * Device Capabilities Detection and Location Services
 * 
 * Provides comprehensive device capability detection and location services
 * for the tattoo artist directory application.
 */

// Device capability detection
export const deviceCapabilities = {
  // Check if geolocation is supported
  hasGeolocation: () => {
    return 'geolocation' in navigator;
  },

  // Check if device has touch support
  hasTouch: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Check if device is mobile
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Check if device is iOS
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // Check if device is Android
  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  },

  // Get device pixel ratio
  getPixelRatio: () => {
    return window.devicePixelRatio || 1;
  },

  // Check if device supports WebP
  supportsWebP: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  },

  // Check network connection type
  getConnectionType: () => {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  },

  // Check if device is in landscape mode
  isLandscape: () => {
    return window.innerWidth > window.innerHeight;
  },

  // Get viewport dimensions
  getViewport: () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
};

// Location services
export const locationServices = {
  // Get current position with options
  getCurrentPosition: (options = {}) => {
    return new Promise((resolve, reject) => {
      if (!deviceCapabilities.hasGeolocation()) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      const finalOptions = { ...defaultOptions, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let errorMessage = 'Location access denied';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        finalOptions
      );
    });
  },

  // Watch position changes
  watchPosition: (callback, errorCallback, options = {}) => {
    if (!deviceCapabilities.hasGeolocation()) {
      errorCallback?.(new Error('Geolocation not supported'));
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    const finalOptions = { ...defaultOptions, ...options };

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage = 'Location tracking failed';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        errorCallback?.(new Error(errorMessage));
      },
      finalOptions
    );
  },

  // Clear position watch
  clearWatch: (watchId) => {
    if (watchId && deviceCapabilities.hasGeolocation()) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  },

  // Convert distance to miles
  kmToMiles: (km) => {
    return km * 0.621371;
  },

  // Format distance for display
  formatDistance: (km, useMetric = true) => {
    if (useMetric) {
      return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
    } else {
      const miles = locationServices.kmToMiles(km);
      return miles < 1 ? `${Math.round(miles * 5280)}ft` : `${miles.toFixed(1)}mi`;
    }
  }
};

// Performance monitoring utilities
export const performanceUtils = {
  // Measure function execution time
  measureTime: async (fn, label = 'Operation') => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Check if device has good performance characteristics
  hasGoodPerformance: () => {
    const memory = navigator.deviceMemory || 4; // Default to 4GB if unknown
    const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores
    const pixelRatio = deviceCapabilities.getPixelRatio();
    
    // Consider good performance if:
    // - Has 4GB+ RAM
    // - Has 4+ CPU cores
    // - Pixel ratio is reasonable (not too high)
    return memory >= 4 && cores >= 4 && pixelRatio <= 3;
  },

  // Get performance tier for adaptive loading
  getPerformanceTier: () => {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const connection = deviceCapabilities.getConnectionType();
    
    if (memory >= 8 && cores >= 8 && ['4g', '5g'].includes(connection)) {
      return 'high';
    } else if (memory >= 4 && cores >= 4 && !['slow-2g', '2g'].includes(connection)) {
      return 'medium';
    } else {
      return 'low';
    }
  }
};

// Storage utilities
export const storageUtils = {
  // Check if localStorage is available
  hasLocalStorage: () => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Check if sessionStorage is available
  hasSessionStorage: () => {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Safe localStorage operations
  setItem: (key, value) => {
    if (!storageUtils.hasLocalStorage()) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
      return false;
    }
  },

  getItem: (key, defaultValue = null) => {
    if (!storageUtils.hasLocalStorage()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
      return defaultValue;
    }
  },

  removeItem: (key) => {
    if (!storageUtils.hasLocalStorage()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Failed to remove from localStorage:', e);
      return false;
    }
  }
};

// Feature detection utilities
export const featureDetection = {
  // Check if Intersection Observer is supported
  hasIntersectionObserver: () => {
    return 'IntersectionObserver' in window;
  },

  // Check if ResizeObserver is supported
  hasResizeObserver: () => {
    return 'ResizeObserver' in window;
  },

  // Check if Web Workers are supported
  hasWebWorkers: () => {
    return 'Worker' in window;
  },

  // Check if Service Workers are supported
  hasServiceWorkers: () => {
    return 'serviceWorker' in navigator;
  },

  // Check if Push API is supported
  hasPushAPI: () => {
    return 'PushManager' in window;
  },

  // Check if Notification API is supported
  hasNotifications: () => {
    return 'Notification' in window;
  },

  // Check if device has camera access
  hasCamera: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (e) {
      return false;
    }
  }
};

// Export all utilities as a single object
export default {
  deviceCapabilities,
  locationServices,
  performanceUtils,
  storageUtils,
  featureDetection
};