import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressStatusIntegration from '../ProgressStatusIntegration';

// Mock the design system components
jest.mock('../../../design-system/components/feedback', () => ({
  FileUploadProgress: ({ files, uploadProgress, onRetry, onCancel }) => (
    <div data-testid="file-upload-progress">
      <div>Files: {files.length}</div>
      <div>Progress: {JSON.stringify(uploadProgress)}</div>
      {onRetry && <button onClick={() => onRetry(files[0])}>Retry</button>}
      {onCancel && <button onClick={onCancel}>Cancel</button>}
    </div>
  ),
  FormSubmissionProgress: ({ steps, currentStep, isSubmitting, error, onRetry }) => (
    <div data-testid="form-submission-progress">
      <div>Steps: {steps.length}</div>
      <div>Current Step: {currentStep}</div>
      <div>Submitting: {isSubmitting.toString()}</div>
      {error && <div>Error: {error}</div>}
      {onRetry && <button onClick={onRetry}>Retry Form</button>}
    </div>
  ),
  ProcessingStatus: ({ status, title, progress, onCancel, onRetry }) => (
    <div data-testid="processing-status">
      <div>Status: {status}</div>
      <div>Title: {title}</div>
      <div>Progress: {progress}</div>
      {onCancel && <button onClick={onCancel}>Cancel</button>}
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
  LoadingStateWithSkeleton: ({ isLoading, children, skeletonType }) => (
    <div data-testid="loading-state">
      {isLoading ? (
        <div>Loading skeleton: {skeletonType}</div>
      ) : (
        children
      )}
    </div>
  ),
  EnhancedAvailabilityStatus: ({ status, onBookingClick, onWaitListClick }) => (
    <div data-testid="availability-status">
      <div>Status: {status}</div>
      {onBookingClick && <button onClick={onBookingClick}>Book Now</button>}
      {onWaitListClick && <button onClick={onWaitListClick}>Join Wait List</button>}
    </div>
  ),
  ProcessingStatusDisplay: ({ status, title, progress, onCancel }) => (
    <div data-testid="processing-status-display">
      <div>Status: {status}</div>
      <div>Title: {title}</div>
      <div>Progress: {progress}</div>
      {onCancel && <button onClick={onCancel}>Cancel Processing</button>}
    </div>
  ),
  CompletionStatusDisplay: ({ isCompleted, title, onViewDetails, onDownload, onShare }) => (
    <div data-testid="completion-status-display">
      <div>Completed: {isCompleted.toString()}</div>
      <div>Title: {title}</div>
      {onViewDetails && <button onClick={onViewDetails}>View Details</button>}
      {onDownload && <button onClick={onDownload}>Download</button>}
      {onShare && <button onClick={onShare}>Share</button>}
    </div>
  ),
  ErrorRecovery: ({ errorType, onAction, showDetails, error }) => (
    <div data-testid="error-recovery">
      <div>Error Type: {errorType}</div>
      <div>Show Details: {showDetails.toString()}</div>
      {error && <div>Error: {error}</div>}
      {onAction && (
        <div>
          <button onClick={() => onAction('retry')}>Retry</button>
          <button onClick={() => onAction('report')}>Report</button>
          <button onClick={() => onAction('goHome')}>Go Home</button>
        </div>
      )}
    </div>
  ),
  InlineErrorRecovery: ({ error, onRetry, onDismiss }) => (
    <div data-testid="inline-error-recovery">
      <div>Error: {error}</div>
      {onRetry && <button onClick={onRetry}>Retry Inline</button>}
      {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
    </div>
  )
}));

jest.mock('../../../design-system/components/ui/Progress', () => ({
  Progress: ({ value, label, showValue }) => (
    <div data-testid="progress">
      <div>Value: {value}</div>
      {label && <div>Label: {label}</div>}
      {showValue && <div>Show Value: true</div>}
    </div>
  ),
  StepProgress: ({ steps, currentStep }) => (
    <div data-testid="step-progress">
      <div>Steps: {steps.length}</div>
      <div>Current: {currentStep}</div>
    </div>
  ),
  CircularProgress: ({ value, showValue, size, variant }) => (
    <div data-testid="circular-progress">
      <div>Value: {value}</div>
      <div>Size: {size}</div>
      <div>Variant: {variant}</div>
      {showValue && <div>Show Value: true</div>}
    </div>
  )
}));

jest.mock('../../../design-system/components/ui/Button/Button', () => {
  return function Button({ children, onClick, disabled, variant, size }) {
    return (
      <button 
        onClick={onClick} 
        disabled={disabled}
        data-variant={variant}
        data-size={size}
      >
        {children}
      </button>
    );
  };
});

jest.mock('../../../design-system/components/ui/Card/Card', () => {
  return function Card({ children, className }) {
    return <div className={className}>{children}</div>;
  };
});

describe('ProgressStatusIntegration', () => {
  beforeEach(() => {
    // Mock window.alert
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all progress and status components', () => {
    render(<ProgressStatusIntegration />);
    
    expect(screen.getByText('Progress Indicators & Status Displays')).toBeInTheDocument();
    expect(screen.getByTestId('file-upload-progress')).toBeInTheDocument();
    expect(screen.getByTestId('form-submission-progress')).toBeInTheDocument();
    expect(screen.getByTestId('processing-status')).toBeInTheDocument();
    expect(screen.getByTestId('availability-status')).toBeInTheDocument();
    expect(screen.getByTestId('processing-status-display')).toBeInTheDocument();
    expect(screen.getByTestId('completion-status-display')).toBeInTheDocument();
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('handles file upload simulation', async () => {
    render(<ProgressStatusIntegration />);
    
    const uploadButton = screen.getByText('Start Upload');
    fireEvent.click(uploadButton);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('Files: 3')).toBeInTheDocument();
  });

  it('handles form submission simulation', async () => {
    render(<ProgressStatusIntegration />);
    
    const submitButton = screen.getByText('Submit Form');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getAllByText('Steps: 4')).toHaveLength(2); // Form and Step Progress sections
  });

  it('handles processing simulation', () => {
    render(<ProgressStatusIntegration />);
    
    const processButton = screen.getByText('Start Processing');
    fireEvent.click(processButton);
    
    expect(screen.getAllByText('Status: processing')).toHaveLength(2); // Processing Status and Processing Status Display
  });

  it('toggles availability status', () => {
    render(<ProgressStatusIntegration />);
    
    const availableButton = screen.getByText('Available');
    const waitingListButton = screen.getByText('Waiting List');
    const unavailableButton = screen.getByText('Unavailable');
    
    fireEvent.click(waitingListButton);
    expect(screen.getByText('Status: busy')).toBeInTheDocument();
    
    fireEvent.click(unavailableButton);
    expect(screen.getByText('Status: unavailable')).toBeInTheDocument();
    
    fireEvent.click(availableButton);
    expect(screen.getByText('Status: available')).toBeInTheDocument();
  });

  it('toggles loading states', () => {
    render(<ProgressStatusIntegration />);
    
    const toggleButton = screen.getByText('Show Loading States');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Loading skeleton: card')).toBeInTheDocument();
    expect(screen.getByText('Hide Loading States')).toBeInTheDocument();
  });

  it('shows and hides error recovery', () => {
    render(<ProgressStatusIntegration />);
    
    const errorButton = screen.getByText('Show Error');
    fireEvent.click(errorButton);
    
    expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
    expect(screen.getByText('Error Type: network')).toBeInTheDocument();
    
    const hideButton = screen.getByText('Hide Error');
    fireEvent.click(hideButton);
  });

  it('handles error recovery actions', () => {
    render(<ProgressStatusIntegration />);
    
    const showErrorButton = screen.getByText('Show Error');
    fireEvent.click(showErrorButton);
    
    expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
    expect(screen.getByText('Error Type: network')).toBeInTheDocument();
    
    // Test that error recovery component is displayed with proper content
    expect(screen.getByText('Show Details: true')).toBeInTheDocument();
  });

  it('handles inline error recovery', () => {
    render(<ProgressStatusIntegration />);
    
    const retryInlineButton = screen.getByText('Retry Inline');
    fireEvent.click(retryInlineButton);
    expect(window.alert).toHaveBeenCalledWith('Retrying...');
    
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    expect(window.alert).toHaveBeenCalledWith('Error dismissed');
  });

  it('handles booking actions', () => {
    render(<ProgressStatusIntegration />);
    
    const bookNowButton = screen.getByText('Book Now');
    fireEvent.click(bookNowButton);
    expect(window.alert).toHaveBeenCalledWith('Opening booking system...');
  });

  it('handles completion status actions', () => {
    render(<ProgressStatusIntegration />);
    
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);
    expect(window.alert).toHaveBeenCalledWith('Viewing profile details...');
    
    const downloadButton = screen.getByText('Download');
    fireEvent.click(downloadButton);
    expect(window.alert).toHaveBeenCalledWith('Downloading profile data...');
    
    const shareButton = screen.getByText('Share');
    fireEvent.click(shareButton);
    expect(window.alert).toHaveBeenCalledWith('Opening share options...');
  });

  it('displays progress components with correct values', () => {
    render(<ProgressStatusIntegration />);
    
    expect(screen.getAllByText('Value: 75')).toHaveLength(2); // Linear and Circular progress
    expect(screen.getByText('Label: Upload Progress')).toBeInTheDocument();
    expect(screen.getAllByText('Show Value: true').length).toBeGreaterThanOrEqual(4); // At least 4 show value indicators
  });

  it('displays step progress correctly', () => {
    render(<ProgressStatusIntegration />);
    
    expect(screen.getAllByText('Steps: 4')).toHaveLength(2); // Form and Step Progress sections
    expect(screen.getByText('Current: 2')).toBeInTheDocument();
  });

  it('displays circular progress variants', () => {
    render(<ProgressStatusIntegration />);
    
    expect(screen.getByText('Value: 25')).toBeInTheDocument();
    expect(screen.getByText('Value: 50')).toBeInTheDocument();
    expect(screen.getAllByText('Value: 75')).toHaveLength(2); // Linear and Circular progress
    expect(screen.getByText('Value: 100')).toBeInTheDocument();
    expect(screen.getByText('Variant: success')).toBeInTheDocument();
    expect(screen.getByText('Variant: warning')).toBeInTheDocument();
    expect(screen.getByText('Variant: error')).toBeInTheDocument();
  });

  it('handles reset functionality', () => {
    render(<ProgressStatusIntegration />);
    
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    expect(screen.getByText('Status: idle')).toBeInTheDocument();
  });
});