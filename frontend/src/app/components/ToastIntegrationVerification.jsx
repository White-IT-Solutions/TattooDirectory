"use client";

import React from 'react';
import { useToast } from '../../design-system/components/feedback/Toast';
import Button from '../../design-system/components/ui/Button/Button';
import Card from '../../design-system/components/ui/Card/Card';

/**
 * Toast Integration Verification Component
 * 
 * This component demonstrates that the toast system is properly integrated
 * across the application and can be used from any component.
 */
export default function ToastIntegrationVerification() {
  const { success, error, warning, info } = useToast();

  const testToastIntegration = () => {
    // Test all toast variants
    success('Toast integration is working correctly!', {
      title: 'Integration Success'
    });

    setTimeout(() => {
      info('All toast variants are available', {
        title: 'System Ready'
      });
    }, 500);

    setTimeout(() => {
      warning('This is a test warning message', {
        title: 'Test Warning'
      });
    }, 1000);

    setTimeout(() => {
      error('This is a test error message', {
        title: 'Test Error',
        action: {
          label: 'Retry',
          onClick: () => success('Retry action executed successfully!')
        }
      });
    }, 1500);
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Toast Integration Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Click the button below to verify that the toast notification system 
        is properly integrated and working across the application.
      </p>
      <Button 
        onClick={testToastIntegration}
        variant="primary"
        className="w-full"
      >
        Test Toast Integration
      </Button>
      
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Expected behavior:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Success toast appears first</li>
          <li>Info toast appears after 0.5s</li>
          <li>Warning toast appears after 1s</li>
          <li>Error toast with retry button appears after 1.5s</li>
          <li>All toasts auto-dismiss after 5 seconds</li>
          <li>Clicking retry button shows success toast</li>
        </ul>
      </div>
    </Card>
  );
}