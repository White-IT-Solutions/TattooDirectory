# Data Visualization Components

A comprehensive set of components for displaying data in beautiful, accessible formats. These components are designed to work seamlessly with the tattoo artist directory's design system.

## Components

### Data Formatting

#### `FormattedPrice`
Displays monetary values with proper currency formatting.

```jsx
import { FormattedPrice } from '@/design-system/components/ui/DataVisualization';

<FormattedPrice amount={150} currency="GBP" />
// Renders: £150.00

<FormattedPrice amount={1500} compact />
// Renders: £1.5K

<PriceRange min={100} max={300} />
// Renders: £100.00 - £300.00
```

#### `FormattedDate`
Displays dates in various human-readable formats.

```jsx
<FormattedDate date="2024-01-15" format="short" />
// Renders: 15 Jan 2024

<FormattedDate date="2024-01-15" format="relative" />
// Renders: 2 days ago
```

#### `FormattedNumber`
Displays numbers with proper formatting and localization.

```jsx
<FormattedNumber value={1234} />
// Renders: 1,234

<FormattedNumber value={1500000} compact />
// Renders: 1.5M

<FormattedNumber value={25} percentage />
// Renders: 25%
```

### Trend Indicators

#### `TrendIndicator`
Shows values with trend direction and percentage change.

```jsx
<TrendIndicator 
  value={150} 
  previousValue={120}
  label="Profile Views"
/>
// Shows: 150 with +25% trend indicator
```

#### `PopularityTrend`
Specialized component for artist popularity metrics.

```jsx
<PopularityTrend 
  currentViews={500}
  previousViews={400}
  currentBookings={12}
  previousBookings={8}
/>
```

#### `TrendBadge`
Compact trend indicator for use in cards and lists.

```jsx
<TrendBadge value={120} previousValue={100} />
// Renders: +20% badge
```

#### `MetricCard`
Complete metric display with title, value, and trend.

```jsx
<MetricCard 
  title="Total Bookings"
  value={45}
  previousValue={38}
  icon={BookingIcon}
/>
```

### Charts

#### `BarChart`
Simple bar chart for categorical data.

```jsx
const data = [
  { label: 'Traditional', value: 25 },
  { label: 'Realism', value: 18 },
  { label: 'Blackwork', value: 12 }
];

<BarChart 
  data={data}
  height={200}
  showValues
  color="var(--interactive-primary)"
/>
```

#### `LineChart`
Line chart for time series data with hover interactions.

```jsx
const data = [
  { date: '2024-01-01', value: 100 },
  { date: '2024-01-02', value: 150 },
  { date: '2024-01-03', value: 120 }
];

<LineChart 
  data={data}
  xKey="date"
  yKey="value"
  height={200}
  smooth
/>
```

#### `DonutChart`
Donut chart for proportional data with legend.

```jsx
const data = [
  { label: 'Traditional', value: 40 },
  { label: 'Realism', value: 30 },
  { label: 'Blackwork', value: 20 },
  { label: 'Other', value: 10 }
];

<DonutChart 
  data={data}
  size={120}
  showLegend
  showCenter
/>
```

#### `AnalyticsDashboard`
Complete analytics dashboard with multiple charts and metrics.

```jsx
const metrics = {
  totalViews: 1500,
  totalBookings: 45,
  averageRating: 4.2,
  activeArtists: 12
};

const chartData = {
  viewsOverTime: [...],
  bookingsByStyle: [...],
  ratingDistribution: [...]
};

<AnalyticsDashboard 
  metrics={metrics}
  chartData={chartData}
/>
```

## Utility Functions

### `formatters`
Direct access to formatting functions for use in custom components.

```jsx
import { formatters } from '@/design-system/components/ui/DataVisualization';

const formattedPrice = formatters.price(150, 'GBP');
const formattedDate = formatters.date(new Date(), 'relative');
const formattedNumber = formatters.number(1234, { compact: true });
const formattedDuration = formatters.duration(90); // "1h 30m"
```

## Design System Integration

All components use design system tokens:

- **Colors**: Primary, accent, success, error, neutral colors
- **Typography**: Consistent font sizes and weights
- **Spacing**: 4px/8px base unit system
- **Shadows**: Elevation system for depth
- **Animations**: Smooth transitions and hover effects

## Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support where applicable
- **Color Contrast**: WCAG AA compliant color combinations
- **Semantic HTML**: Proper use of semantic elements
- **Focus Management**: Clear focus indicators

## Performance Considerations

- **Lazy Rendering**: Charts only render when visible
- **Memoization**: Expensive calculations are memoized
- **SVG Optimization**: Efficient SVG rendering for charts
- **Responsive**: All components adapt to container size

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ for basic functionality
- Mobile browsers (iOS Safari, Chrome Mobile)

## Examples

### Artist Profile Metrics
```jsx
<div className="grid grid-cols-2 gap-4">
  <MetricCard 
    title="Profile Views"
    value={1250}
    previousValue={980}
    format="compact"
  />
  <MetricCard 
    title="Booking Rate"
    value={8.5}
    previousValue={7.2}
    format="percentage"
  />
</div>
```

### Studio Analytics
```jsx
<AnalyticsDashboard 
  metrics={{
    totalViews: 5200,
    totalBookings: 156,
    averageRating: 4.6,
    activeArtists: 8
  }}
  chartData={{
    viewsOverTime: monthlyViews,
    bookingsByStyle: styleBreakdown,
    ratingDistribution: ratingStats
  }}
/>
```

### Pricing Display
```jsx
<div className="space-y-2">
  <div className="flex justify-between">
    <span>Hourly Rate:</span>
    <FormattedPrice amount={120} />
  </div>
  <div className="flex justify-between">
    <span>Minimum Charge:</span>
    <FormattedPrice amount={80} />
  </div>
  <div className="flex justify-between">
    <span>Typical Range:</span>
    <PriceRange min={80} max={300} />
  </div>
</div>
```