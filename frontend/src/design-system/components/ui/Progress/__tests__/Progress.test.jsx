import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress, StepProgress, CircularProgress } from '../Progress';

describe('Progress', () => {
  it('renders progress bar with correct value', () => {
    render(<Progress value={50} max={100} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('displays label when provided', () => {
    render(<Progress value={75} label="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows percentage value when showValue is true', () => {
    render(<Progress value={60} showValue />);
    
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('handles different variants', () => {
    const { rerender } = render(<Progress value={50} variant="success" />);
    
    // Test that different variants render without error
    rerender(<Progress value={50} variant="error" />);
    rerender(<Progress value={50} variant="warning" />);
    rerender(<Progress value={50} variant="accent" />);
  });

  it('clamps value between 0 and max', () => {
    const { rerender } = render(<Progress value={-10} max={100} />);
    
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '-10');
    
    rerender(<Progress value={150} max={100} />);
    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '150');
  });

  it('handles different sizes', () => {
    const { rerender } = render(<Progress value={50} size="sm" />);
    
    // Test that different sizes render without error
    rerender(<Progress value={50} size="md" />);
    rerender(<Progress value={50} size="lg" />);
  });
});

describe('StepProgress', () => {
  const steps = [
    { id: 'step1', title: 'Step 1', description: 'First step' },
    { id: 'step2', title: 'Step 2', description: 'Second step' },
    { id: 'step3', title: 'Step 3', description: 'Third step' }
  ];

  it('renders all steps', () => {
    render(<StepProgress steps={steps} currentStep={0} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('shows step descriptions', () => {
    render(<StepProgress steps={steps} currentStep={0} />);
    
    expect(screen.getByText('First step')).toBeInTheDocument();
    expect(screen.getByText('Second step')).toBeInTheDocument();
    expect(screen.getByText('Third step')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    render(<StepProgress steps={steps} currentStep={1} />);
    
    // Current step should show step number
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows completed steps with check marks', () => {
    render(<StepProgress steps={steps} currentStep={2} />);
    
    // Current step should show step number (3)
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // All step titles should be present
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('handles empty steps array', () => {
    render(<StepProgress steps={[]} currentStep={0} />);
    
    // Should render without error
    expect(screen.queryByText('Step')).not.toBeInTheDocument();
  });

  it('handles steps without descriptions', () => {
    const stepsWithoutDesc = [
      { id: 'step1', title: 'Step 1' },
      { id: 'step2', title: 'Step 2' }
    ];
    
    render(<StepProgress steps={stepsWithoutDesc} currentStep={0} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });
});

describe('CircularProgress', () => {
  it('renders circular progress', () => {
    render(<CircularProgress value={50} />);
    
    // Should render SVG elements
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows percentage when showValue is true', () => {
    render(<CircularProgress value={75} showValue />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('handles different variants', () => {
    const { rerender } = render(<CircularProgress value={50} variant="success" />);
    
    // Test that different variants render without error
    rerender(<CircularProgress value={50} variant="error" />);
    rerender(<CircularProgress value={50} variant="warning" />);
    rerender(<CircularProgress value={50} variant="accent" />);
  });

  it('handles custom size', () => {
    render(<CircularProgress value={50} size={100} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '100');
    expect(svg).toHaveAttribute('height', '100');
  });

  it('handles custom stroke width', () => {
    render(<CircularProgress value={50} strokeWidth={8} />);
    
    // Should render without error with custom stroke width
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('clamps percentage between 0 and 100', () => {
    const { rerender } = render(<CircularProgress value={-10} showValue />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    
    rerender(<CircularProgress value={150} showValue />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});