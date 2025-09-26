"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { ToastProvider, useToast } from "../../design-system/components/ui/Toast/Toast";
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../design-system/components/ui/Card/Card";
import Input, { EmailInput, TextInput } from "../../design-system/components/ui/Input/Input";
import Button from "../../design-system/components/ui/Button/Button";
import FileUpload from "../../design-system/components/ui/FileUpload/FileUpload";
import { StepProgress } from "../../design-system/components/ui/Progress/Progress";
import Breadcrumb, { BreadcrumbItem, HomeBreadcrumb } from "../../design-system/components/ui/Breadcrumb/Breadcrumb";

// Form steps configuration
const FORM_STEPS = [
  {
    id: 'identity',
    title: 'Identity',
    description: 'Verify your identity'
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Provide request details'
  },
  {
    id: 'evidence',
    title: 'Evidence',
    description: 'Upload supporting documents'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review and submit'
  }
];

// Validation functions
const validateStep = (step, formData, files) => {
  const errors = {};

  switch (step) {
    case 0: // Identity step
      if (!formData.email) {
        errors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (!formData.fullName) {
        errors.fullName = 'Full name is required';
      }
      
      if (!formData.instagram) {
        errors.instagram = 'Instagram username is required';
      } else if (!/^[a-zA-Z0-9._]+$/.test(formData.instagram)) {
        errors.instagram = 'Please enter a valid Instagram username';
      }
      break;

    case 1: // Details step
      if (!formData.requestType) {
        errors.requestType = 'Please select a request type';
      }
      
      if (!formData.reason) {
        errors.reason = 'Please provide a reason for your request';
      } else if (formData.reason.length < 10) {
        errors.reason = 'Please provide a more detailed reason (minimum 10 characters)';
      }
      break;

    case 2: // Evidence step
      if (formData.requestType === 'copyright' && files.length === 0) {
        errors.files = 'Please upload supporting documents for copyright claims';
      }
      break;

    case 3: // Review step
      if (!formData.confirmAccuracy) {
        errors.confirmAccuracy = 'Please confirm the accuracy of your information';
      }
      break;
  }

  return errors;
};

// Main form component
function TakedownRequestForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Identity
    email: "",
    fullName: "",
    instagram: "",
    
    // Details
    requestType: "",
    reason: "",
    urgency: "normal",
    
    // Evidence
    additionalInfo: "",
    
    // Review
    confirmAccuracy: false,
    agreeToTerms: false
  });
  
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const toast = useToast();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file changes
  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
    if (errors.files) {
      setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  // Navigate between steps
  const goToStep = (step) => {
    if (step >= 0 && step < FORM_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep, formData, files);
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error('Please fix the errors below', 'Some fields need your attention');
      return;
    }
    
    setErrors({});
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    const stepErrors = validateStep(currentStep, formData, files);
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error('Please fix the errors below', 'Some fields need your attention');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare form data for submission
      const submissionData = {
        ...formData,
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })),
        submittedAt: new Date().toISOString()
      };

      await api.submitRemovalRequest({
        instagramHandle: formData.instagram,
        reason: formData.reason,
        requestType: formData.requestType,
        email: formData.email,
        fullName: formData.fullName,
        urgency: formData.urgency,
        additionalInfo: formData.additionalInfo,
        files: submissionData.files
      });

      setIsSubmitted(true);
      toast.success(
        'Request submitted successfully!', 
        'We will review your request and respond within 5 business days.'
      );
    } catch (error) {
      console.error("Failed to submit request:", error);
      toast.error(
        'Failed to submit request', 
        'Please try again or contact support if the problem persists.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Breadcrumb className="mb-6">
            <HomeBreadcrumb />
            <BreadcrumbItem href="/takedown">Takedown Request</BreadcrumbItem>
            <BreadcrumbItem current>Success</BreadcrumbItem>
          </Breadcrumb>

          <Card className="text-center">
            <CardContent className="py-12">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-[var(--feedback-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Request Submitted Successfully
              </h1>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Thank you for your takedown request. We will review your submission and respond within 5 business days.
              </p>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>Reference ID:</strong> TR-{Date.now().toString().slice(-8)}
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.href = '/'}
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-secondary)] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <HomeBreadcrumb />
          <BreadcrumbItem current>Takedown Request</BreadcrumbItem>
        </Breadcrumb>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Content Takedown Request
          </h1>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            If you believe your content has been used without permission or you wish to remove your profile from our directory, 
            please complete this form. We take these requests seriously and will respond within 5 business days.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <StepProgress 
            steps={FORM_STEPS} 
            currentStep={currentStep}
          />
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{FORM_STEPS[currentStep].title}</CardTitle>
            <CardDescription>{FORM_STEPS[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Identity */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <EmailInput
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  helpText="We'll use this to contact you about your request"
                />

                <TextInput
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  required
                  helpText="Your legal name as it appears on official documents"
                />

                <TextInput
                  label="Instagram Username"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  error={errors.instagram}
                  required
                  placeholder="username (without @)"
                  helpText="The Instagram account associated with your content"
                />
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Request Type *
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'profile-removal', label: 'Remove my entire profile', description: 'Remove all information about me from the directory' },
                      { value: 'image-removal', label: 'Remove specific images', description: 'Remove certain portfolio images only' },
                      { value: 'copyright', label: 'Copyright infringement', description: 'My copyrighted work is being used without permission' },
                      { value: 'incorrect-info', label: 'Incorrect information', description: 'Update or correct information about me' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 p-3 border border-[var(--border-primary)] rounded-[var(--radius-md)] hover:bg-[var(--background-tertiary)] cursor-pointer">
                        <input
                          type="radio"
                          name="requestType"
                          value={option.value}
                          checked={formData.requestType === option.value}
                          onChange={handleChange}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{option.label}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.requestType && (
                    <p className="mt-2 text-sm text-[var(--feedback-error)]">{errors.requestType}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Detailed Reason *
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={5}
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] bg-[var(--background-primary)] text-[var(--text-primary)]"
                    placeholder="Please provide a detailed explanation of your request..."
                  />
                  {errors.reason && (
                    <p className="mt-2 text-sm text-[var(--feedback-error)]">{errors.reason}</p>
                  )}
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Minimum 10 characters. Be as specific as possible to help us process your request quickly.
                  </p>
                </div>

                <div>
                  <label htmlFor="urgency" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Urgency Level
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] bg-[var(--background-primary)] text-[var(--text-primary)]"
                  >
                    <option value="low">Low - No immediate concerns</option>
                    <option value="normal">Normal - Standard processing</option>
                    <option value="high">High - Urgent attention needed</option>
                    <option value="critical">Critical - Legal or safety concerns</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Evidence */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <FileUpload
                  label="Supporting Documents"
                  description="Upload any supporting documents (images, legal notices, etc.)"
                  multiple
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024} // 10MB
                  allowedTypes={['image/*', 'application/pdf', '.doc', '.docx', '.txt']}
                  files={files}
                  onFilesChange={handleFilesChange}
                  error={errors.files}
                />

                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Additional Information
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    rows={4}
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] bg-[var(--background-primary)] text-[var(--text-primary)]"
                    placeholder="Any additional context or information that might help us process your request..."
                  />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Optional: Provide any additional context that might help us understand your request.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-[var(--background-tertiary)] p-6 rounded-[var(--radius-lg)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4">Review Your Request</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">Email:</span>
                      <span className="ml-2 text-[var(--text-secondary)]">{formData.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">Name:</span>
                      <span className="ml-2 text-[var(--text-secondary)]">{formData.fullName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">Instagram:</span>
                      <span className="ml-2 text-[var(--text-secondary)]">@{formData.instagram}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">Request Type:</span>
                      <span className="ml-2 text-[var(--text-secondary)]">{formData.requestType}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">Urgency:</span>
                      <span className="ml-2 text-[var(--text-secondary)]">{formData.urgency}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">Files:</span>
                      <span className="ml-2 text-[var(--text-secondary)]">{files.length} file(s) attached</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="confirmAccuracy"
                      checked={formData.confirmAccuracy}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <span className="text-sm text-[var(--text-primary)]">
                      I confirm that the information provided is accurate and complete to the best of my knowledge.
                    </span>
                  </label>
                  {errors.confirmAccuracy && (
                    <p className="text-sm text-[var(--feedback-error)]">{errors.confirmAccuracy}</p>
                  )}

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <span className="text-sm text-[var(--text-primary)]">
                      I understand that submitting false information may result in my request being denied and could have legal consequences.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              {currentStep < FORM_STEPS.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={nextStep}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={!formData.confirmAccuracy || !formData.agreeToTerms}
                >
                  Submit Request
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Main page component with toast provider
export const dynamic = 'force-dynamic';

export default function TakedownPage() {
  return (
    <ToastProvider>
      <TakedownRequestForm />
    </ToastProvider>
  );
}
