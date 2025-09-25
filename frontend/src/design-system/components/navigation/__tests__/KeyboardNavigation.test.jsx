import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { 
  KeyboardNavigationProvider, 
  useKeyboardNavigation,
  Focusable,
  SkipLinks,
  KeyboardShortcutsHelp
} from '../KeyboardNavigation';

// Test component that uses the keyboard navigation context
const TestComponent = () => {
  const { isKeyboardMode, focusedElement } = useKeyboardNavigation();
  
  return (
    <div>
      <span data-testid="keyboard-mode">
        {isKeyboardMode ? 'keyboard' : 'mouse'}
      </span>
      <span data-testid="focused-element">
        {focusedElement ? 'focused' : 'not-focused'}
      </span>
      <button>Test Button</button>
      <input placeholder="Test Input" />
    </div>
  );
};

describe('KeyboardNavigationProvider', () => {
  it('detects keyboard mode when Tab is pressed', () => {
    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>
    );

    expect(screen.getByTestId('keyboard-mode')).toHaveTextContent('mouse');

    // Simulate Tab key press
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(screen.getByTestId('keyboard-mode')).toHaveTextContent('keyboard');
  });

  it('switches to mouse mode on mouse interaction', () => {
    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>
    );

    // Start in keyboard mode
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByTestId('keyboard-mode')).toHaveTextContent('keyboard');

    // Mouse interaction
    fireEvent.mouseDown(document);
    expect(screen.getByTestId('keyboard-mode')).toHaveTextContent('mouse');
  });

  it('focuses search input when "/" is pressed', () => {
    render(
      <KeyboardNavigationProvider>
        <input type="search" placeholder="Search..." />
        <TestComponent />
      </KeyboardNavigationProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    
    fireEvent.keyDown(document, { key: '/' });
    
    expect(searchInput).toHaveFocus();
  });

  it('shows keyboard shortcuts help when "?" is pressed', () => {
    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>
    );

    fireEvent.keyDown(document, { key: '?', shiftKey: true });
    
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('hides shortcuts help when Escape is pressed', async () => {
    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>
    );

    // Show shortcuts
    fireEvent.keyDown(document, { key: '?', shiftKey: true });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    // Hide with Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Wait for the component to update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('calls onShortcut callback when shortcuts are used', () => {
    const mockOnShortcut = jest.fn();
    
    render(
      <KeyboardNavigationProvider onShortcut={mockOnShortcut}>
        <input type="search" placeholder="Search..." />
      </KeyboardNavigationProvider>
    );

    fireEvent.keyDown(document, { key: '/' });
    
    expect(mockOnShortcut).toHaveBeenCalledWith('focusSearch', expect.any(Object));
  });
});

describe('SkipLinks', () => {
  const skipLinks = [
    { href: '#main', label: 'Skip to main content' },
    { href: '#nav', label: 'Skip to navigation' }
  ];

  it('renders skip links', () => {
    render(<SkipLinks links={skipLinks} />);
    
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
  });

  it('shows skip link when focused', () => {
    render(<SkipLinks links={skipLinks} />);
    
    const skipLink = screen.getByText('Skip to main content');
    fireEvent.focus(skipLink);
    
    // Skip link should have the correct classes for visibility
    expect(skipLink).toHaveClass('absolute');
    expect(skipLink.parentElement).toHaveClass('sr-only');
  });
});

describe('KeyboardShortcutsHelp', () => {
  const shortcuts = [
    { key: 'Tab', description: 'Navigate forward', action: 'tab' },
    { key: '/', description: 'Focus search', action: 'search' }
  ];

  it('renders shortcuts when visible', () => {
    render(
      <KeyboardShortcutsHelp 
        shortcuts={shortcuts} 
        visible={true} 
      />
    );
    
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Navigate forward')).toBeInTheDocument();
    expect(screen.getByText('Focus search')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <KeyboardShortcutsHelp 
        shortcuts={shortcuts} 
        visible={false} 
      />
    );
    
    // Component should have pointer-events-none when not visible
    const helpDialog = screen.getByRole('dialog');
    expect(helpDialog).toHaveClass('pointer-events-none');
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(
      <KeyboardShortcutsHelp 
        shortcuts={shortcuts} 
        visible={true} 
        onClose={mockOnClose}
      />
    );
    
    const closeButton = screen.getByLabelText('Close shortcuts help');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const mockOnClose = jest.fn();
    
    render(
      <KeyboardShortcutsHelp 
        shortcuts={shortcuts} 
        visible={true} 
        onClose={mockOnClose}
      />
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('Focusable', () => {
  it('handles focus events in keyboard mode', () => {
    const TestFocusable = () => (
      <KeyboardNavigationProvider showFocusIndicator={false} showSkipLinks={false}>
        <Focusable>
          <button>Focusable Button</button>
        </Focusable>
      </KeyboardNavigationProvider>
    );

    render(<TestFocusable />);
    
    // Switch to keyboard mode
    fireEvent.keyDown(document, { key: 'Tab' });
    
    const button = screen.getByText('Focusable Button');
    fireEvent.focus(button);
    
    // Should handle focus in keyboard mode
    expect(button).toHaveFocus();
  });

  it('responds to focus key shortcut', () => {
    const TestFocusable = () => (
      <KeyboardNavigationProvider showFocusIndicator={false} showSkipLinks={false}>
        <Focusable focusKey="f">
          <button>Focusable Button</button>
        </Focusable>
      </KeyboardNavigationProvider>
    );

    render(<TestFocusable />);
    
    fireEvent.keyDown(document, { key: 'f' });
    
    const button = screen.getByText('Focusable Button');
    expect(button).toHaveFocus();
  });
});