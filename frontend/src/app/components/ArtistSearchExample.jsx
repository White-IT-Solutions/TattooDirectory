/**
 * ArtistSearchExample Component
 * 
 * Example component demonstrating how to use the RFC 9457 error handling
 * utilities with the API client and error display components.
 */

'use client';

import { useState } from 'react';
import { api, ApiError } from '../../lib/api.js';
import { useApiError, useApiOperation } from '../../lib/useApiError.js';
import ErrorDisplay, { InlineError } from './ErrorDisplay.jsx';

export default function ArtistSearchExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStyle, setSearchStyle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // Example using useApiOperation hook
  const artistSearch = useApiOperation(api.searchArtists, {
    onSuccess: (data) => {
      console.log('Search successful:', data);
    },
    onError: (error) => {
      console.log('Search failed:', error.getUserFriendlyMessage());
    }
  });

  // Example using useApiError hook for manual error handling
  const { 
    error: manualError, 
    errorMessage: manualErrorMessage,
    isLoading: isManualLoading,
    executeApiCall,
    clearError
  } = useApiError();

  const handleSearch = async () => {
    try {
      await artistSearch.execute({
        query: searchQuery || undefined,
        style: searchStyle || undefined,
        location: searchLocation || undefined
      });
    } catch (error) {
      // Error is already handled by useApiOperation
      console.log('Search error caught:', error);
    }
  };

  const handleManualSearch = async () => {
    try {
      const result = await executeApiCall(
        () => api.searchArtists({
          query: searchQuery || undefined,
          style: searchStyle || undefined,
          location: searchLocation || undefined
        }),
        { operation: 'manual-search', query: searchQuery }
      );
      console.log('Manual search result:', result);
    } catch (error) {
      // Error is handled by useApiError hook
    }
  };

  const handleDirectApiCall = async () => {
    try {
      const result = await api.getStyles();
      console.log('Styles loaded:', result);
    } catch (error) {
      if (error instanceof ApiError) {
        console.log('API Error:', error.getUserFriendlyMessage());
        console.log('Error details:', {
          type: error.type,
          status: error.status,
          title: error.title
        });
      } else {
        console.log('Unknown error:', error.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Artist Search with Error Handling
      </h2>

      {/* Search Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700">
            Search Query
          </label>
          <input
            type="text"
            id="query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Artist name or keyword"
          />
        </div>

        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700">
            Style
          </label>
          <input
            type="text"
            id="style"
            value={searchStyle}
            onChange={(e) => setSearchStyle(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., traditional, realism"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="City or postcode"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleSearch}
          disabled={artistSearch.isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {artistSearch.isLoading ? 'Searching...' : 'Search (useApiOperation)'}
        </button>

        <button
          onClick={handleManualSearch}
          disabled={isManualLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isManualLoading ? 'Searching...' : 'Search (useApiError)'}
        </button>

        <button
          onClick={handleDirectApiCall}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Load Styles (Direct API)
        </button>
      </div>

      {/* Error Display Examples */}
      
      {/* Error from useApiOperation */}
      {artistSearch.error && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            useApiOperation Error:
          </h3>
          <ErrorDisplay
            error={artistSearch.error}
            onRetry={artistSearch.isRetryable ? handleSearch : undefined}
            onDismiss={() => artistSearch.reset()}
            showDetails={true}
          />
        </div>
      )}

      {/* Error from useApiError */}
      {manualError && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            useApiError Error:
          </h3>
          <ErrorDisplay
            error={manualError}
            onRetry={handleManualSearch}
            onDismiss={clearError}
            showDetails={true}
          />
          
          {/* Example of inline error */}
          <div className="mt-2">
            <InlineError error={manualError} />
          </div>
        </div>
      )}

      {/* Success Results */}
      {artistSearch.data && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            Search Results:
          </h3>
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <pre className="text-sm text-green-800 overflow-auto">
              {JSON.stringify(artistSearch.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Usage Examples */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Handling Examples:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Try searching without any parameters to see a 400 error</li>
          <li>• Search for a non-existent artist ID to see a 404 error</li>
          <li>• The system will show user-friendly messages for all error types</li>
          <li>• Server errors (5xx) will show retry buttons</li>
          <li>• All errors are logged to the console for debugging</li>
        </ul>
      </div>
    </div>
  );
}