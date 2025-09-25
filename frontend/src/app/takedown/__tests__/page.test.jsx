import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TakedownPage from '../page';
import { api } from '../../../lib/api';

// Mock the API
jest.mock('../../../lib/api', () => ({
  api: {
    submitRemovalRequest: jest.fn()
  }
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('TakedownPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the takedown request form', () => {
    render(<TakedownPage />);
    
    expect(screen.getByText('Content Takedown Request')).toBeInTheDocument();
    expect(screen.getAllByText('Identity')).toHaveLength(2); // Step progress + card header
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('shows step progress indicator', () => {
    render(<TakedownPage />);
    
    expect(screen.getAllByText('Identity')).toHaveLength(2);
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('validates required fields in step 1', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Try to proceed without filling required fields
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email address is required')).toBeInTheDocument();
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Instagram username is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates Instagram username format', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    const instagramInput = screen.getByLabelText(/instagram username/i);
    await user.type(instagramInput, 'invalid@username!');
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid Instagram username')).toBeInTheDocument();
    });
  });

  it('progresses to step 2 when step 1 is valid', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Fill out step 1
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
    });
    
    // Check for the request type label specifically
    await waitFor(() => {
      expect(screen.getByText('Request Type *')).toBeInTheDocument();
    });
  });

  it('validates request type selection in step 2', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Complete step 1
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    // Wait for step 2 to load, then try to proceed without selecting request type
    await waitFor(() => {
      expect(screen.getByText('Request Type *')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select a request type')).toBeInTheDocument();
    });
  });

  it('validates reason field in step 2', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Complete step 1
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    // Wait for step 2 to load - check for step indicator instead
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
    });
    
    // Select request type but provide insufficient reason
    const profileRemovalOption = screen.getByText('Remove my entire profile');
    await user.click(profileRemovalOption);
    
    const reasonTextarea = screen.getByLabelText(/detailed reason/i);
    await user.type(reasonTextarea, 'short');
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please provide a more detailed reason (minimum 10 characters)')).toBeInTheDocument();
    });
  });

  it('progresses through all steps with valid data', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Step 1: Identity
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    // Step 2: Details
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
    });
    
    const profileRemovalOption = screen.getByText('Remove my entire profile');
    await user.click(profileRemovalOption);
    
    const reasonTextarea = screen.getByLabelText(/detailed reason/i);
    await user.type(reasonTextarea, 'I want to remove my profile because I no longer want to be listed.');
    
    await user.click(screen.getByText('Next'));
    
    // Step 3: Evidence
    await waitFor(() => {
      expect(screen.getByText('Supporting Documents')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Next'));
    
    // Step 4: Review
    await waitFor(() => {
      expect(screen.getByText('Review Your Request')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });
  });

  it('requires confirmation checkboxes in review step', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Complete all steps
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
    });
    
    const profileRemovalOption = screen.getByText('Remove my entire profile');
    await user.click(profileRemovalOption);
    
    const reasonTextarea = screen.getByLabelText(/detailed reason/i);
    await user.type(reasonTextarea, 'I want to remove my profile because I no longer want to be listed.');
    
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Supporting Documents')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Next'));
    
    // Try to submit without checking confirmation boxes
    await waitFor(() => {
      const submitButton = screen.getByText('Submit Request');
      expect(submitButton).toBeDisabled();
    });
  });

  it('submits form successfully when all requirements are met', async () => {
    const user = userEvent.setup();
    api.submitRemovalRequest.mockResolvedValue({ success: true });
    
    render(<TakedownPage />);
    
    // Complete all steps
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
    });
    
    const profileRemovalOption = screen.getByText('Remove my entire profile');
    await user.click(profileRemovalOption);
    
    const reasonTextarea = screen.getByLabelText(/detailed reason/i);
    await user.type(reasonTextarea, 'I want to remove my profile because I no longer want to be listed.');
    
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Supporting Documents')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Next'));
    
    // Check confirmation boxes and submit
    await waitFor(() => {
      expect(screen.getByText('Review Your Request')).toBeInTheDocument();
    });
    
    const confirmAccuracy = screen.getByLabelText(/confirm that the information provided is accurate/i);
    await user.click(confirmAccuracy);
    
    const agreeToTerms = screen.getByLabelText(/understand that submitting false information/i);
    await user.click(agreeToTerms);
    
    const submitButton = screen.getByText('Submit Request');
    await user.click(submitButton);
    
    // Verify API call
    await waitFor(() => {
      expect(api.submitRemovalRequest).toHaveBeenCalledWith({
        instagramHandle: 'johndoe',
        reason: 'I want to remove my profile because I no longer want to be listed.',
        requestType: 'profile-removal',
        email: 'test@example.com',
        fullName: 'John Doe',
        urgency: 'normal',
        additionalInfo: '',
        files: []
      });
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Request Submitted Successfully')).toBeInTheDocument();
    });
  });

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup();
    api.submitRemovalRequest.mockRejectedValue(new Error('Network error'));
    
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TakedownPage />);
    
    // Complete all steps quickly
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
    });
    
    const profileRemovalOption = screen.getByText('Remove my entire profile');
    await user.click(profileRemovalOption);
    
    const reasonTextarea = screen.getByLabelText(/detailed reason/i);
    await user.type(reasonTextarea, 'I want to remove my profile because I no longer want to be listed.');
    
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Supporting Documents')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Review Your Request')).toBeInTheDocument();
    });
    
    const confirmAccuracy = screen.getByLabelText(/confirm that the information provided is accurate/i);
    await user.click(confirmAccuracy);
    
    const agreeToTerms = screen.getByLabelText(/understand that submitting false information/i);
    await user.click(agreeToTerms);
    
    const submitButton = screen.getByText('Submit Request');
    await user.click(submitButton);
    
    // Should show error toast (we can't easily test toast content, but we can verify the form doesn't show success)
    await waitFor(() => {
      expect(screen.queryByText('Request Submitted Successfully')).not.toBeInTheDocument();
    });
    
    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('allows navigation between completed steps', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Complete step 1
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    // Go to step 2, then back to step 1
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
    });
    
    await user.click(screen.getByText('Previous'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toHaveValue('test@example.com');
      expect(screen.getByLabelText(/full name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/instagram username/i)).toHaveValue('johndoe');
    });
  });

  it('shows breadcrumb navigation', () => {
    render(<TakedownPage />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Takedown Request')).toBeInTheDocument();
  });

  it('displays urgency level options', async () => {
    const user = userEvent.setup();
    render(<TakedownPage />);
    
    // Complete step 1
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/instagram username/i), 'johndoe');
    await user.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getAllByText('Details')).toHaveLength(2); // Step progress + card header
      
      const urgencySelect = screen.getByLabelText(/urgency level/i);
      expect(urgencySelect).toBeInTheDocument();
      
      // Check that options are available
      expect(screen.getByText('Low - No immediate concerns')).toBeInTheDocument();
      expect(screen.getByText('Normal - Standard processing')).toBeInTheDocument();
      expect(screen.getByText('High - Urgent attention needed')).toBeInTheDocument();
      expect(screen.getByText('Critical - Legal or safety concerns')).toBeInTheDocument();
    });
  });
});