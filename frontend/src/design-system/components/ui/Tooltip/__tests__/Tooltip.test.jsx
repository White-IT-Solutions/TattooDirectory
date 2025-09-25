import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from '../Tooltip';

describe('Tooltip Component', () => {
  it('renders tooltip content on hover', async () => {
    const user = userEvent.setup();
    
    render(
      <Tooltip content="Test tooltip content">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });
    
    // Tooltip should not be visible initially
    expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
    
    // Hover over trigger
    await user.hover(trigger);
    
    // Wait for delay and check if tooltip appears
    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    }, { timeout: 400 });
  });

  it('hides tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    
    render(
      <Tooltip content="Test tooltip content" delay={100}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });
    
    // Hover to show tooltip
    await user.hover(trigger);
    await waitFor(() => {
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    });
    
    // Unhover to hide tooltip
    await user.unhover(trigger);
    
    await waitFor(() => {
      expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('shows tooltip on focus and hides on blur', async () => {
    const user = userEvent.setup();
    
    render(
      <Tooltip content="Focus tooltip" delay={100}>
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Focus me' });
    
    // Focus trigger
    await user.tab();
    expect(trigger).toHaveFocus();
    
    await waitFor(() => {
      expect(screen.getByText('Focus tooltip')).toBeInTheDocument();
    });
    
    // Blur trigger
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByText('Focus tooltip')).not.toBeInTheDocument();
    });
  });

  it('hides tooltip on Escape key', async () => {
    const user = userEvent.setup();
    
    render(
      <Tooltip content="Escape tooltip" delay={100}>
        <button>Test button</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');
    
    // Show tooltip
    await user.hover(trigger);
    await waitFor(() => {
      expect(screen.getByText('Escape tooltip')).toBeInTheDocument();
    });
    
    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Escape tooltip')).not.toBeInTheDocument();
    }, { timeout: 300 });
  });

  it('respects different positions', () => {
    const positions = ['top', 'bottom', 'left', 'right'];
    
    positions.forEach(position => {
      const { unmount } = render(
        <Tooltip content="Test" position={position}>
          <button>Test</button>
        </Tooltip>
      );
      
      // Test that component renders without error
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });

  it('does not show tooltip when disabled', async () => {
    const user = userEvent.setup();
    
    render(
      <Tooltip content="Should not show" disabled>
        <button>Disabled tooltip</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');
    
    await user.hover(trigger);
    
    // Wait longer than delay to ensure tooltip doesn't appear
    await new Promise(resolve => setTimeout(resolve, 400));
    
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', async () => {
    const user = userEvent.setup();
    
    render(
      <Tooltip content="Accessible tooltip" delay={100}>
        <button>Accessible button</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');
    
    await user.hover(trigger);
    
    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveAttribute('aria-hidden', 'false');
    });
  });
});