"use client";

import React, { useState, useEffect } from 'react';
import {
  FileUploadProgress,
  FormSubmissionProgress,
  ProcessingStatus,
  LoadingStateWithSkeleton,
  EnhancedAvailabilityStatus,
  ProcessingStatusDisplay,
  CompletionStatusDisplay,
  ErrorRecovery,
  InlineErrorRecovery
} from '../../design-system/components/feedback';
import { Progress, StepProgress, CircularProgress } from '../../design-system/components/ui/Progress';
import Button from '../../design-system/components/ui/Button/Button';
import Card from '../../design-system/components/ui/Card/Card';

export default function ProgressStatusIntegration() {
  // File upload state
  const [uploadFiles, setUploadFiles] = useState([
    { name: 'portfolio-image-1.jpg', size: 2048000 },
    { name: 'portfolio-image-2.jpg', size: 1536000 },
    { name: 'artist-bio.pdf', size: 512000 }
  ]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  // Form submission state
  const [formSteps] = useState([
    { id: 1, title: 'Validate Data', description: 'Checking form inputs' },
    { id: 2, title: 'Process Images', description: 'Optimizing uploaded images' },
    { id: 3, title: 'Save Profile', description: 'Creating artist profile' },
    { id: 4, title: 'Send Notifications', description: 'Notifying relevant parties' }
  ]);
  const [currentFormStep, setCurrentFormStep] = useState(0);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState(null);

  // Processing state
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Availability status
  const [availabilityStatus, setAvailabilityStatus] = useState({
    status: 'available',
    nextAvailable: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    waitingList: false,
    waitingListCount: 0,
    emergencySlots: true,
    consultationRequired: false
  });

  // Loading states
  const [showLoadingStates, setShowLoadingStates] = useState(false);

  // Error state
  const [showError, setShowError] = useState(false);

  // Simulate file upload
  const simulateFileUpload = () => {
    setIsUploading(true);
    setUploadProgress({});

    uploadFiles.forEach((file, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress: 100, status: 'completed' }
          }));
        } else if (Math.random() < 0.1 && progress > 50) {
          // Simulate random error
          clearInterval(interval);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress, status: 'error', error: 'Upload failed - network error' }
          }));
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress, status: 'uploading' }
          }));
        }
      }, 200 + index * 100);
    });

    setTimeout(() => setIsUploading(false), 5000);
  };

  // Simulate form submission
  const simulateFormSubmission = () => {
    setIsSubmittingForm(true);
    setCurrentFormStep(0);
    setFormError(null);

    const processStep = (stepIndex) => {
      if (stepIndex >= formSteps.length) {
        setIsSubmittingForm(false);
        return;
      }

      setCurrentFormStep(stepIndex);
      
      setTimeout(() => {
        // Simulate random error on step 2
        if (stepIndex === 2 && Math.random() < 0.3) {
          setFormError('Failed to save profile - server error');
          setIsSubmittingForm(false);
          return;
        }
        
        processStep(stepIndex + 1);
      }, 1500);
    };

    processStep(0);
  };

  // Simulate processing
  const simulateProcessing = () => {
    setProcessingStatus('processing');
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setProcessingStatus('completed');
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  // Retry handlers
  const handleRetryUpload = (file) => {
    setUploadProgress(prev => ({
      ...prev,
      [file.name]: { progress: 0, status: 'uploading' }
    }));
    
    // Simulate retry
    setTimeout(() => {
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { progress: 100, status: 'completed' }
      }));
    }, 2000);
  };

  const handleRetryForm = () => {
    setFormError(null);
    simulateFormSubmission();
  };

  const handleErrorAction = (action) => {
    switch (action) {
      case 'retry':
        setShowError(false);
        setTimeout(() => setShowError(true), 1000);
        break;
      case 'report':
        alert('Error reported to support team');
        break;
      case 'goHome':
        alert('Redirecting to home page...');
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Progress Indicators & Status Displays
        </h1>
        <p className="text-[var(--text-secondary)]">
          Comprehensive progress tracking, status indicators, and error recovery mechanisms
        </p>
      </div>

      {/* File Upload Progress */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">File Upload Progress</h2>
        <div className="space-y-4">
          <Button onClick={simulateFileUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Start Upload'}
          </Button>
          
          <FileUploadProgress
            files={uploadFiles}
            uploadProgress={uploadProgress}
            onRetry={handleRetryUpload}
            onCancel={() => {
              setIsUploading(false);
              setUploadProgress({});
            }}
          />
        </div>
      </Card>

      {/* Form Submission Progress */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Form Submission Progress</h2>
        <div className="space-y-4">
          <Button onClick={simulateFormSubmission} disabled={isSubmittingForm}>
            {isSubmittingForm ? 'Submitting...' : 'Submit Form'}
          </Button>
          
          <FormSubmissionProgress
            steps={formSteps}
            currentStep={currentFormStep}
            isSubmitting={isSubmittingForm}
            error={formError}
            onRetry={handleRetryForm}
          />
        </div>
      </Card>

      {/* Processing Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Processing Status</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={simulateProcessing} disabled={processingStatus === 'processing'}>
              Start Processing
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setProcessingStatus('idle');
                setProcessingProgress(0);
              }}
            >
              Reset
            </Button>
          </div>
          
          <ProcessingStatus
            status={processingStatus}
            title="Data Processing"
            description="Processing artist portfolio data and generating thumbnails"
            progress={processingProgress}
            estimatedTime={120}
            onCancel={() => {
              setProcessingStatus('idle');
              setProcessingProgress(0);
            }}
            onRetry={() => simulateProcessing()}
          />
        </div>
      </Card>

      {/* Enhanced Availability Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Enhanced Availability Status</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setAvailabilityStatus(prev => ({ ...prev, status: 'available', waitingList: false }))}
            >
              Available
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setAvailabilityStatus(prev => ({ ...prev, status: 'busy', waitingList: true, waitingListCount: 12 }))}
            >
              Waiting List
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setAvailabilityStatus(prev => ({ ...prev, status: 'unavailable', waitingList: false }))}
            >
              Unavailable
            </Button>
          </div>
          
          <EnhancedAvailabilityStatus
            status={availabilityStatus.status}
            title="Artist Booking Status"
            nextAvailable={availabilityStatus.nextAvailable}
            waitingList={availabilityStatus.waitingList}
            waitingListCount={availabilityStatus.waitingListCount}
            estimatedWaitTime="2-3 weeks"
            emergencySlots={availabilityStatus.emergencySlots}
            consultationRequired={availabilityStatus.consultationRequired}
            onBookingClick={() => alert('Opening booking system...')}
            onWaitListClick={() => alert('Joining waiting list...')}
          />
        </div>
      </Card>

      {/* Processing Status Display */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Processing Status Display</h2>
        <ProcessingStatusDisplay
          status="processing"
          title="Portfolio Analysis"
          description="Analyzing uploaded images and extracting style characteristics"
          progress={67}
          steps={[
            'Image validation',
            'Style detection',
            'Quality assessment',
            'Metadata extraction',
            'Thumbnail generation'
          ]}
          currentStep={2}
          onCancel={() => alert('Processing cancelled')}
        />
      </Card>

      {/* Completion Status Display */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Completion Status Display</h2>
        <CompletionStatusDisplay
          isCompleted={true}
          title="Profile Creation Complete"
          description="Your artist profile has been successfully created and is now live"
          completedAt={new Date().toISOString()}
          duration="2 minutes 34 seconds"
          results={['Profile created', '12 images processed', 'SEO optimized']}
          onViewDetails={() => alert('Viewing profile details...')}
          onDownload={() => alert('Downloading profile data...')}
          onShare={() => alert('Opening share options...')}
        />
      </Card>

      {/* Loading States with Skeleton */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Loading States with Skeleton</h2>
        <div className="space-y-4">
          <Button onClick={() => setShowLoadingStates(!showLoadingStates)}>
            {showLoadingStates ? 'Hide' : 'Show'} Loading States
          </Button>
          
          <LoadingStateWithSkeleton
            isLoading={showLoadingStates}
            skeletonType="card"
            skeletonCount={2}
          >
            <div className="space-y-4">
              <div className="p-4 border border-[var(--border-primary)] rounded-[var(--radius)]">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-[var(--interactive-primary)] rounded-full flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div>
                    <h3 className="font-semibold">John Doe</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Traditional & Neo-Traditional</p>
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-[var(--radius)] mb-4"></div>
                <p className="text-sm">Experienced tattoo artist specializing in traditional and neo-traditional styles...</p>
              </div>
            </div>
          </LoadingStateWithSkeleton>
        </div>
      </Card>

      {/* Error Recovery */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Error Recovery</h2>
        <div className="space-y-4">
          <Button onClick={() => setShowError(!showError)}>
            {showError ? 'Hide' : 'Show'} Error
          </Button>
          
          {showError && (
            <ErrorRecovery
              errorType="network"
              onAction={handleErrorAction}
              showDetails={true}
              error="Failed to connect to server: ERR_NETWORK_TIMEOUT"
            />
          )}
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Inline Error Recovery</h3>
            <InlineErrorRecovery
              error="Failed to save changes"
              onRetry={() => alert('Retrying...')}
              onDismiss={() => alert('Error dismissed')}
            />
          </div>
        </div>
      </Card>

      {/* Basic Progress Components */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Progress Components</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Linear Progress</h3>
            <Progress value={75} label="Upload Progress" showValue />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Step Progress</h3>
            <StepProgress
              steps={[
                { id: 1, title: 'Personal Info', description: 'Basic details' },
                { id: 2, title: 'Portfolio', description: 'Upload images' },
                { id: 3, title: 'Verification', description: 'Confirm details' },
                { id: 4, title: 'Complete', description: 'Profile ready' }
              ]}
              currentStep={2}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Circular Progress</h3>
            <div className="flex gap-4">
              <CircularProgress value={25} showValue size={80} />
              <CircularProgress value={50} showValue size={80} variant="success" />
              <CircularProgress value={75} showValue size={80} variant="warning" />
              <CircularProgress value={100} showValue size={80} variant="error" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}