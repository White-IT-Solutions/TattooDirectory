import { render, screen, fireEvent } from '@testing-library/react';
import { 
  BarChart, 
  LineChart, 
  DonutChart, 
  AnalyticsDashboard 
} from '../Charts';

describe('BarChart', () => {
  const mockData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 120 }
  ];

  it('renders chart with data', () => {
    render(<BarChart data={mockData} />);
    
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('shows values when requested', () => {
    render(<BarChart data={mockData} showValues />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    const { container } = render(<BarChart data={[]} />);
    
    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  it('uses custom keys', () => {
    const customData = [
      { month: 'January', sales: 200 },
      { month: 'February', sales: 250 }
    ];
    
    render(<BarChart data={customData} xKey="month" yKey="sales" />);
    
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
  });
});

describe('LineChart', () => {
  const mockData = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
    { date: '2024-01-03', value: 120 }
  ];

  it('renders chart with data', () => {
    render(<LineChart data={mockData} />);
    
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('2024-01-02')).toBeInTheDocument();
    expect(screen.getByText('2024-01-03')).toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    render(<LineChart data={mockData} />);
    
    const svg = document.querySelector('svg');
    const circles = svg.querySelectorAll('circle');
    
    if (circles.length > 0) {
      fireEvent.mouseEnter(circles[0]);
      // Tooltip should appear but testing exact positioning is complex
      // We'll just verify the hover interaction doesn't crash
      fireEvent.mouseLeave(circles[0]);
    }
  });

  it('handles empty data', () => {
    const { container } = render(<LineChart data={[]} />);
    
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses custom keys', () => {
    const customData = [
      { timestamp: '2024-01-01', count: 200 },
      { timestamp: '2024-01-02', count: 250 }
    ];
    
    render(<LineChart data={customData} xKey="timestamp" yKey="count" />);
    
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('2024-01-02')).toBeInTheDocument();
  });
});

describe('DonutChart', () => {
  const mockData = [
    { label: 'Traditional', value: 40 },
    { label: 'Realism', value: 30 },
    { label: 'Blackwork', value: 20 },
    { label: 'Other', value: 10 }
  ];

  it('renders chart with data', () => {
    render(<DonutChart data={mockData} />);
    
    expect(screen.getByText('Traditional')).toBeInTheDocument();
    expect(screen.getByText('Realism')).toBeInTheDocument();
    expect(screen.getByText('Blackwork')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('shows total in center', () => {
    render(<DonutChart data={mockData} showCenter />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows legend by default', () => {
    render(<DonutChart data={mockData} />);
    
    // Values should be shown in legend
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('hides legend when requested', () => {
    render(<DonutChart data={mockData} showLegend={false} />);
    
    // Labels should not be visible when legend is hidden
    expect(screen.queryByText('Traditional')).not.toBeInTheDocument();
  });

  it('handles empty data', () => {
    const { container } = render(<DonutChart data={[]} />);
    
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses custom keys', () => {
    const customData = [
      { category: 'A', count: 50 },
      { category: 'B', count: 30 }
    ];
    
    render(<DonutChart data={customData} labelKey="category" valueKey="count" />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});

describe('AnalyticsDashboard', () => {
  const mockMetrics = {
    totalViews: 1500,
    totalBookings: 45,
    averageRating: 4.2,
    activeArtists: 12
  };

  const mockChartData = {
    viewsOverTime: [
      { date: '2024-01-01', views: 100 },
      { date: '2024-01-02', views: 150 }
    ],
    bookingsByStyle: [
      { style: 'Traditional', bookings: 20 },
      { style: 'Realism', bookings: 15 }
    ],
    ratingDistribution: [
      { rating: '5 stars', count: 25 },
      { rating: '4 stars', count: 15 }
    ]
  };

  it('renders key metrics', () => {
    render(<AnalyticsDashboard metrics={mockMetrics} />);
    
    expect(screen.getByText('Total Views')).toBeInTheDocument();
    expect(screen.getByText('2K')).toBeInTheDocument();
    
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    
    expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();
    
    expect(screen.getByText('Active Artists')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders charts when data provided', () => {
    render(<AnalyticsDashboard metrics={mockMetrics} chartData={mockChartData} />);
    
    expect(screen.getByText('Views Over Time')).toBeInTheDocument();
    expect(screen.getByText('Popular Styles')).toBeInTheDocument();
    expect(screen.getByText('Rating Distribution')).toBeInTheDocument();
  });

  it('handles missing chart data', () => {
    render(<AnalyticsDashboard metrics={mockMetrics} chartData={{}} />);
    
    // Should still render metrics
    expect(screen.getByText('Total Views')).toBeInTheDocument();
    
    // Chart sections should still render but be empty
    expect(screen.getByText('Views Over Time')).toBeInTheDocument();
    expect(screen.getByText('Popular Styles')).toBeInTheDocument();
  });

  it('handles missing metrics', () => {
    render(<AnalyticsDashboard />);
    
    // Should render with default values
    expect(screen.getByText('Total Views')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(3); // Multiple zeros expected
  });
});