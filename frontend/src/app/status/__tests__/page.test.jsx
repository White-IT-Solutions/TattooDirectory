import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusPage from '../page';

// Mock the design system components
jest.mock('../../../design-system/components/ui/Card/Card', () => {
  const Card = ({ children, className, ...props }) => (
    <div data-testid="card" className={className} {...props}>{children}</div>
  );
  Card.displayName = 'Card';
  
  const CardHeader = ({ children, ...props }) => (
    <div data-testid="card-header" {...props}>{children}</div>
  );
  CardHeader.displayName = 'CardHeader';
  
  const CardTitle = ({ children, ...props }) => (
    <h3 data-testid="card-title" {...props}>{children}</h3>
  );
  CardTitle.displayName = 'CardTitle';
  
  const CardDescription = ({ children, ...props }) => (
    <p data-testid="card-description" {...props}>{children}</p>
  );
  CardDescription.displayName = 'CardDescription';
  
  const CardContent = ({ children, ...props }) => (
    <div data-testid="card-content" {...props}>{children}</div>
  );
  CardContent.displayName = 'CardContent';
  
  const CardFooter = ({ children, ...props }) => (
    <div data-testid="card-footer" {...props}>{children}</div>
  );
  CardFooter.displayName = 'CardFooter';
  
  return {
    __esModule: true,
    default: Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
  };
});

jest.mock('../../../design-system/components/ui/Button/Button', () => {
  const Button = ({ children, loading, onClick, variant, ...props }) => (
    <button 
      data-testid="button"
      data-variant={variant}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
  Button.displayName = 'Button';
  return { __esModule: true, default: Button };
});

jest.mock('../../../design-system/components/ui/Skeleton/Skeleton', () => {
  const Skeleton = ({ className, ...props }) => (
    <div data-testid="skeleton" className={className} {...props} />
  );
  
  const SkeletonVariants = {
    Badge: (props) => <div data-testid="skeleton-badge" {...props} />
  };
  
  return {
    __esModule: true,
    Skeleton,
    SkeletonVariants
  };
});

describe('StatusPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now to have consistent timestamps
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01T12:00:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the status page with loading state initially', () => {
    render(<StatusPage />);
    
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Real-time status and performance metrics for the Tattoo Artist Directory')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0); // Should have skeleton elements
  });

  it('displays service status cards after loading', async () => {
    render(<StatusPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check that all services are displayed
    expect(screen.getByText('API Gateway')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Search Engine')).toBeInTheDocument();
    expect(screen.getByText('CDN & Images')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });

  it('displays performance metrics after loading', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getAllByText('99.7%').length).toBeGreaterThan(0);
    }, { timeout: 2000 });

    // Check performance metrics (using getAllByText since some values appear multiple times)
    expect(screen.getAllByText('99.7%').length).toBeGreaterThan(0); // Uptime
    expect(screen.getByText('2.4M')).toBeInTheDocument(); // Total requests
    expect(screen.getByText('287ms')).toBeInTheDocument(); // Avg response time
    expect(screen.getByText('0.02%')).toBeInTheDocument(); // Error rate
    expect(screen.getByText('1,247')).toBeInTheDocument(); // Active users
  });

  it('displays incident history after loading', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Search Performance Degradation')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Search Performance Degradation')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Authentication Maintenance')).toBeInTheDocument();
  });

  it('shows correct status indicators for different service states', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check that different status types are displayed
    const operationalElements = screen.getAllByText('Operational');
    const degradedElements = screen.getAllByText('Degraded');
    const maintenanceElements = screen.getAllByText('Maintenance');
    
    expect(operationalElements.length).toBeGreaterThan(0);
    expect(degradedElements.length).toBeGreaterThan(0);
    expect(maintenanceElements.length).toBeGreaterThan(0);
  });

  it('handles subscription toggle correctly', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Subscribe to Updates')).toBeInTheDocument();
    }, { timeout: 2000 });

    const subscribeButton = screen.getByText('Subscribe to Updates');
    
    // Click subscribe
    fireEvent.click(subscribeButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
    
    // Should show subscribed state after loading
    await waitFor(() => {
      expect(screen.getByText('Unsubscribe')).toBeInTheDocument();
    }, { timeout: 1500 });
    
    // Should show success message
    expect(screen.getByText(/You're subscribed to status updates/)).toBeInTheDocument();
  });

  it('displays overall system status correctly', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Some Systems Degraded')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Should show degraded status because search engine is degraded
    expect(screen.getByText('Some Systems Degraded')).toBeInTheDocument();
  });

  it('formats time correctly', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check that time formatting works (should show "2m ago", "1m ago", etc.)
    const timeElements = screen.getAllByText(/\d+[mh] ago|Just now/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('displays service metrics correctly', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('API Gateway')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check that service metrics are displayed (using getAllByText for duplicates)
    expect(screen.getAllByText('99.9%').length).toBeGreaterThan(0); // API uptime (appears multiple times)
    expect(screen.getByText('245ms')).toBeInTheDocument(); // API response time
    expect(screen.getByText('98.5%')).toBeInTheDocument(); // Search uptime
    expect(screen.getByText('1.2s')).toBeInTheDocument(); // Search response time
  });

  it('renders footer links correctly', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Support Center')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Support Center')).toBeInTheDocument();
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(screen.getByText('Service Level Agreement')).toBeInTheDocument();
  });

  it('handles RSS feed button click', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('RSS Feed')).toBeInTheDocument();
    }, { timeout: 2000 });

    const rssButton = screen.getByText('RSS Feed');
    expect(rssButton).toBeInTheDocument();
    
    // Should be clickable
    fireEvent.click(rssButton);
  });

  it('displays incident severity badges correctly', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Minor')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Minor')).toBeInTheDocument();
    expect(screen.getAllByText('Maintenance').length).toBeGreaterThan(0); // Appears in both service status and incident
  });

  it('shows scheduled maintenance information', async () => {
    render(<StatusPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scheduled Authentication Maintenance')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Should show scheduled time information
    expect(screen.getByText(/Scheduled:/)).toBeInTheDocument();
  });
});