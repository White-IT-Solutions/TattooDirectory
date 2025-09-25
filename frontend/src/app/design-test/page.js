"use client";

import { useState, useEffect } from 'react';
import Button from '../../design-system/components/ui/Button/Button';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../../design-system/components/ui/Card/Card';
import { 
  Input,
  TextInput,
  EmailInput,
  PasswordInput,
  SearchInput
} from '../../design-system/components/ui/Input/Input';
import Badge from '../../design-system/components/ui/Badge/Badge';
import Tag from '../../design-system/components/ui/Tag/Tag';
import { StudioCard, StudioCardCompact } from '../../design-system/components/ui/StudioCard';
import { mockStudios } from '../data/mockStudioData';
import { 
  Skeleton, 
  SkeletonVariants,
  ArtistCardSkeleton,
  ArtistCardSkeletonGrid,
  StudioCardSkeleton,
  StudioCardSkeletonGrid,
  ProgressiveImage,
  StaggeredLoader,
  ContentPlaceholder,
  InfiniteScrollLoader
} from '../../design-system/components/ui/Skeleton';

export const dynamic = 'force-dynamic';

export default function DesignTestPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (shouldBeDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Debug: Measure actual widths
    setTimeout(() => {
      const measureWidth = (selector, targetId) => {
        const element = document.querySelector(selector);
        const target = document.getElementById(targetId);
        if (element && target) {
          const width = element.getBoundingClientRect().width;
          target.textContent = `${Math.round(width)}px`;
        }
      };

      measureWidth('.max-w-xs.bg-red-200', 'debug-xs-width');
      measureWidth('.max-w-sm.bg-blue-200', 'debug-sm-width');
      measureWidth('.max-w-lg.bg-green-200', 'debug-lg-width');
    }, 100);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Define our color values directly for testing
  const colors = {
    primary: {
      50: '#f7f6f7',
      100: '#eeecee',
      200: '#ddd9dd',
      300: '#c4bcc4',
      400: '#a599a5',
      500: '#5c475c',
      600: '#523f52',
      700: '#453645',
      800: '#382d38',
      900: '#2b222b',
    },
    neutral: {
      50: '#f8f8f8',
      100: '#ebebeb',
      200: '#d6d6d6',
      300: '#bfc0c0',
      400: '#a8a9a9',
      500: '#919292',
      600: '#7a7b7b',
      700: '#636464',
      800: '#5b585f',
      900: '#4a474d',
    },
    accent: {
      50: '#fef7f4',
      100: '#fdeee8',
      200: '#fbd5c5',
      300: '#f8bca2',
      400: '#f4a37f',
      500: '#ef8354',
      600: '#e6653b',
      700: '#cc4a22',
      800: '#b33f1d',
      900: '#993518',
    },
    success: { 500: '#22c55e' },
    warning: { 500: '#f59e0b' },
    error: { 500: '#ef4444' },
  };

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ 
        backgroundColor: 'var(--background-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="max-w-none mx-auto p-8 space-y-12">
        {/* Header with Dark Mode Toggle */}
        <div className="text-center">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-heading-1 font-brand text-interactive-primary">
              Design System Test
            </h1>
            <button
              onClick={toggleDarkMode}
              className="btn-base bg-interactive-secondary text-foreground px-4 py-2 rounded-lg hover:bg-interactive-secondary-hover transition-colors"
              style={{ 
                backgroundColor: 'var(--interactive-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
          <p 
            className="text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Testing our comprehensive CSS custom properties system with dark mode support
          </p>
          
          {/* Component Examples - All integrated into this page */}
          <div className="flex justify-center gap-4 mt-6">
            <a 
              href="#visual-effects" 
              className="px-4 py-2 bg-[var(--interactive-accent)] text-white rounded-lg hover:bg-[var(--interactive-accent-hover)] transition-colors"
            >
              Visual Effects
            </a>
            <a 
              href="#toast-system" 
              className="px-4 py-2 bg-[var(--interactive-primary)] text-white rounded-lg hover:bg-[var(--interactive-primary-hover)] transition-colors"
            >
              Toast System
            </a>
            <a 
              href="#error-handling" 
              className="px-4 py-2 bg-[var(--feedback-error)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Error Handling
            </a>
          </div>
          
          {/* Debug Info */}
          {isClient && (
            <div 
              className="mt-4 p-4 rounded border text-sm"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-muted)'
              }}
            >
              <strong>Debug Info:</strong> Dark mode: {isDarkMode ? 'ON' : 'OFF'} | 
              HTML classes: {document.documentElement.className || 'none'}
            </div>
          )}
        </div>

        {/* CSS Custom Properties Demo */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            CSS Custom Properties System
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Semantic Colors */}
            <div 
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--background-primary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <h3 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Semantic Colors
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: 'var(--interactive-primary)' }}
                  ></div>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Primary Interactive
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: 'var(--interactive-accent)' }}
                  ></div>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Accent Interactive
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: 'var(--feedback-success)' }}
                  ></div>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Success Feedback
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: 'var(--feedback-warning)' }}
                  ></div>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Warning Feedback
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: 'var(--feedback-error)' }}
                  ></div>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Error Feedback
                  </span>
                </div>
              </div>
            </div>

            {/* Shadow System */}
            <div className="card-base p-6">
              <h3 className="text-heading-3 text-foreground mb-4">Shadow System</h3>
              <div className="space-y-4">
                <div className="p-3 bg-background-secondary rounded shadow-elevation-1">
                  <span className="text-body-small text-secondary">Elevation 1</span>
                </div>
                <div className="p-3 bg-background-secondary rounded shadow-elevation-3">
                  <span className="text-body-small text-secondary">Elevation 3</span>
                </div>
                <div className="p-3 bg-background-secondary rounded shadow-elevation-5">
                  <span className="text-body-small text-secondary">Elevation 5</span>
                </div>
                <div className="p-3 bg-background-secondary rounded shadow-primary">
                  <span className="text-body-small text-secondary">Primary Shadow</span>
                </div>
              </div>
            </div>

            {/* Animation Tokens */}
            <div className="card-base p-6">
              <h3 className="text-heading-3 text-foreground mb-4">Animation System</h3>
              <div className="space-y-4">
                <button className="w-full p-3 bg-interactive-primary text-white rounded transition-fast hover:bg-interactive-primary-hover">
                  Fast Transition (150ms)
                </button>
                <button className="w-full p-3 bg-interactive-accent text-white rounded transition-smooth hover:bg-interactive-accent-hover">
                  Smooth Transition (200ms)
                </button>
                <button className="w-full p-3 bg-interactive-secondary text-foreground rounded transition-slow hover:bg-interactive-secondary-hover">
                  Slow Transition (300ms)
                </button>
                <div className="p-3 bg-background-secondary rounded animate-fade-in">
                  <span className="text-body-small text-secondary">Fade In Animation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card Component System */}
        <section className="space-y-8">
          <h2 className="text-heading-2 font-heading text-foreground">
            Card Component System
          </h2>
          
          <div className="space-y-8">
            {/* Elevation Variants */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Elevation Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card elevation="flat" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Flat</h4>
                    <p className="text-sm text-[var(--text-secondary)]">No shadow, border only</p>
                  </CardContent>
                </Card>
                
                <Card elevation="low" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Low</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Subtle shadow</p>
                  </CardContent>
                </Card>
                
                <Card elevation="medium" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Medium</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Default elevation</p>
                  </CardContent>
                </Card>
                
                <Card elevation="high" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">High</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Strong shadow</p>
                  </CardContent>
                </Card>
                
                <Card elevation="floating" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Floating</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Hover to lift</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Padding Variants */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Padding Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="none" className="w-full border-2 border-dashed border-[var(--border-primary)]">
                  <CardContent>
                    <div className="p-4 bg-[var(--background-secondary)] m-2 rounded">
                      <h4 className="font-semibold mb-2">None</h4>
                      <p className="text-sm text-[var(--text-secondary)]">No padding</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card padding="sm" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Small</h4>
                    <p className="text-sm text-[var(--text-secondary)]">16px padding</p>
                  </CardContent>
                </Card>
                
                <Card padding="md" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Medium</h4>
                    <p className="text-sm text-[var(--text-secondary)]">24px padding</p>
                  </CardContent>
                </Card>
                
                <Card padding="lg" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Large</h4>
                    <p className="text-sm text-[var(--text-secondary)]">32px padding</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Card Composition Examples */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Card Composition</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Card</CardTitle>
                    <CardDescription>
                      A simple card with header and content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      This is the main content area of the card. It can contain any type of content.
                    </p>
                  </CardContent>
                </Card>

                {/* Card with Footer */}
                <Card>
                  <CardHeader>
                    <CardTitle>Card with Footer</CardTitle>
                    <CardDescription>
                      Includes action buttons in footer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Content area with footer actions below.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" variant="outline" className="mr-2">Cancel</Button>
                    <Button size="sm">Save</Button>
                  </CardFooter>
                </Card>

                {/* Complex Card */}
                <Card elevation="high">
                  <CardHeader>
                    <CardTitle>Artist Profile</CardTitle>
                    <CardDescription>
                      Example of a complex card layout
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--interactive-primary)] rounded-full"></div>
                        <div>
                          <p className="font-semibold text-sm">John Smith</p>
                          <p className="text-xs text-[var(--text-secondary)]">Traditional, Realism</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-[var(--interactive-accent)] text-white text-xs rounded">Traditional</span>
                        <span className="px-2 py-1 bg-[var(--interactive-accent)] text-white text-xs rounded">Realism</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" variant="accent" className="w-full">View Profile</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {/* Interactive Examples */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Interactive Examples</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hover Effects */}
                <Card elevation="low" className="cursor-pointer">
                  <CardHeader>
                    <CardTitle>Hover Effects</CardTitle>
                    <CardDescription>
                      Hover over this card to see elevation change
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      This card demonstrates smooth hover transitions with shadow changes.
                    </p>
                  </CardContent>
                </Card>

                {/* Floating Card */}
                <Card elevation="floating" className="cursor-pointer">
                  <CardHeader>
                    <CardTitle>Floating Card</CardTitle>
                    <CardDescription>
                      Hover to see lift animation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--text-secondary)]">
                      This card lifts up on hover with a transform animation.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Radius Variants */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Border Radius Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card radius="none" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">None</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Sharp corners</p>
                  </CardContent>
                </Card>
                
                <Card radius="sm" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Small</h4>
                    <p className="text-sm text-[var(--text-secondary)]">4px radius</p>
                  </CardContent>
                </Card>
                
                <Card radius="md" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Medium</h4>
                    <p className="text-sm text-[var(--text-secondary)]">8px radius</p>
                  </CardContent>
                </Card>
                
                <Card radius="lg" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">Large</h4>
                    <p className="text-sm text-[var(--text-secondary)]">12px radius (default)</p>
                  </CardContent>
                </Card>
                
                <Card radius="xl" className="w-full">
                  <CardContent>
                    <h4 className="font-semibold mb-2">XL</h4>
                    <p className="text-sm text-[var(--text-secondary)]">16px radius</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Component Examples */}
        <section className="space-y-8">
          <h2 className="text-heading-2 font-heading text-foreground">
            Enhanced Component Examples
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Enhanced Button Component */}
            <div className="card-base p-6">
              <h3 className="text-heading-3 text-foreground mb-4">Enhanced Button Component</h3>
              <div className="space-y-6">
                {/* Button Variants */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Variants</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="accent">Accent</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>

                {/* Button Sizes */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Sizes</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small (32px)</Button>
                    <Button size="md">Medium (40px)</Button>
                    <Button size="lg">Large (48px)</Button>
                  </div>
                </div>

                {/* Loading States */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Loading States</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button loading>Loading</Button>
                    <Button loading variant="secondary">Loading Secondary</Button>
                    <Button loading variant="outline" size="sm">Loading Small</Button>
                    <Button loading variant="accent" size="lg">Loading Large</Button>
                  </div>
                </div>

                {/* Disabled States */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Disabled States</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled Primary</Button>
                    <Button disabled variant="secondary">Disabled Secondary</Button>
                    <Button disabled variant="outline">Disabled Outline</Button>
                    <Button disabled variant="accent">Disabled Accent</Button>
                  </div>
                </div>

                {/* Interactive Demo */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Interactive Demo</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => alert('Primary clicked!')}>
                      Click Me
                    </Button>
                    <Button 
                      variant="accent" 
                      onClick={() => console.log('Accent button clicked')}
                    >
                      Console Log
                    </Button>
                    <Button 
                      variant="outline"
                      onMouseEnter={() => console.log('Button hovered')}
                    >
                      Hover Me
                    </Button>
                  </div>
                </div>

                {/* Focus States Demo */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Focus States (Tab to test)</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button>Tab 1</Button>
                    <Button variant="secondary">Tab 2</Button>
                    <Button variant="outline">Tab 3</Button>
                    <Button variant="accent">Tab 4</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Components */}
            <div className="card-base p-6">
              <h3 className="text-heading-3 text-foreground mb-4">Input Component System</h3>
              <div className="space-y-6">
                {/* Input Types */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Input Types</h4>
                  <div className="space-y-4">
                    <TextInput 
                      label="Text Input"
                      placeholder="Enter your name"
                      helpText="Your full name as it appears on official documents"
                    />
                    <EmailInput 
                      label="Email Input"
                      placeholder="your@email.com"
                      helpText="We'll use this to send you updates"
                    />
                    <PasswordInput 
                      label="Password Input"
                      placeholder="Enter your password"
                      helpText="Must be at least 8 characters long"
                    />
                    <SearchInput 
                      label="Search Input"
                      placeholder="Search artists, styles, or locations..."
                      helpText="Use keywords to find what you're looking for"
                    />
                  </div>
                </div>

                {/* Input Sizes */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Input Sizes</h4>
                  <div className="space-y-4">
                    <Input 
                      size="sm"
                      label="Small Input (32px)"
                      placeholder="Small input"
                    />
                    <Input 
                      size="md"
                      label="Medium Input (40px)"
                      placeholder="Medium input (default)"
                    />
                    <Input 
                      size="lg"
                      label="Large Input (48px)"
                      placeholder="Large input"
                    />
                  </div>
                </div>

                {/* Validation States */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Validation States</h4>
                  <div className="space-y-4">
                    <Input 
                      label="Default State"
                      placeholder="Default input"
                      helpText="This is a normal input field"
                    />
                    <Input 
                      label="Success State"
                      placeholder="Valid input"
                      success="Great! This input is valid"
                    />
                    <Input 
                      label="Warning State"
                      placeholder="Warning input"
                      warning="Please double-check this information"
                    />
                    <Input 
                      label="Error State"
                      placeholder="Invalid input"
                      error="This field is required"
                    />
                  </div>
                </div>

                {/* Required Fields */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Required Fields</h4>
                  <div className="space-y-4">
                    <Input 
                      label="Required Field"
                      placeholder="This field is required"
                      required
                      helpText="Fields marked with * are required"
                    />
                    <EmailInput 
                      label="Email Address"
                      placeholder="your@email.com"
                      required
                      error="Please enter a valid email address"
                    />
                  </div>
                </div>

                {/* Disabled State */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Disabled State</h4>
                  <div className="space-y-4">
                    <Input 
                      label="Disabled Input"
                      placeholder="This input is disabled"
                      disabled
                      helpText="This field is currently disabled"
                    />
                    <PasswordInput 
                      label="Disabled Password"
                      placeholder="Disabled password field"
                      disabled
                      value="hidden-password"
                    />
                  </div>
                </div>

                {/* Complex Examples */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Complex Examples</h4>
                  <div className="space-y-4">
                    <SearchInput 
                      size="lg"
                      label="Artist Search"
                      placeholder="Search by name, style, or location"
                      helpText="Try searching for 'traditional', 'London', or specific artist names"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="First Name"
                        placeholder="John"
                        required
                      />
                      <Input 
                        label="Last Name"
                        placeholder="Smith"
                        required
                      />
                    </div>
                    <EmailInput 
                      label="Contact Email"
                      placeholder="john.smith@example.com"
                      success="Email format is valid"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Components */}
            <div className="card-base p-6">
              <h3 className="text-heading-3 text-foreground mb-4">Feedback Components</h3>
              <div className="space-y-4">
                <div className="bg-success p-4 rounded-lg border">
                  <p className="text-success font-semibold">Success Message</p>
                  <p className="text-body-small text-secondary mt-1">Your profile has been updated successfully.</p>
                </div>
                <div className="bg-warning p-4 rounded-lg border">
                  <p className="text-warning font-semibold">Warning Message</p>
                  <p className="text-body-small text-secondary mt-1">Please verify your email address.</p>
                </div>
                <div className="bg-error p-4 rounded-lg border">
                  <p className="text-error font-semibold">Error Message</p>
                  <p className="text-body-small text-secondary mt-1">Unable to save changes. Please try again.</p>
                </div>
                <div className="bg-info p-4 rounded-lg border">
                  <p className="text-info font-semibold">Info Message</p>
                  <p className="text-body-small text-secondary mt-1">New features are available in your dashboard.</p>
                </div>
              </div>
            </div>

            {/* Card Variations */}
            <div className="card-base p-6">
              <h3 className="text-heading-3 text-foreground mb-4">Card Variations</h3>
              <div className="space-y-4">
                <div className="bg-background-secondary p-4 rounded-lg border-subtle">
                  <h4 className="font-semibold text-foreground">Basic Card</h4>
                  <p className="text-body-small text-secondary mt-2">Standard card with subtle background</p>
                </div>
                <div className="bg-background p-4 rounded-lg shadow-elevation-3 hover:shadow-elevation-5 transition-shadow">
                  <h4 className="font-semibold text-foreground">Elevated Card</h4>
                  <p className="text-body-small text-secondary mt-2">Card with shadow and hover effect</p>
                </div>
                <div className="bg-background p-4 rounded-lg border-2 border-interactive-primary">
                  <h4 className="font-semibold text-interactive-primary">Highlighted Card</h4>
                  <p className="text-body-small text-secondary mt-2">Card with primary border accent</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="space-y-8">
          <h2 className="text-heading-2 font-heading text-foreground">
            Color Palette
          </h2>
          
          {/* Primary Colors */}
          <div className="space-y-4">
            <h3 className="text-heading-3 text-secondary">
              Primary (Eggplant)
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-4">
              {Object.entries(colors.primary).map(([shade, color]) => (
                <div key={shade} className="text-center">
                  <div 
                    className="h-16 w-full rounded-md border border-muted"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs mt-2 text-secondary">
                    {shade}
                  </p>
                  <p className="text-xs text-muted">
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Colors */}
          <div className="space-y-4">
            <h3 className="text-heading-3 text-secondary">
              Neutral (Davy&apos;s Gray to Silver)
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-4">
              {Object.entries(colors.neutral).map(([shade, color]) => (
                <div key={shade} className="text-center">
                  <div 
                    className="h-16 w-full rounded-md border border-muted"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs mt-2 text-secondary">
                    {shade}
                  </p>
                  <p className="text-xs text-muted">
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Accent Colors */}
          <div className="space-y-4">
            <h3 className="text-heading-3 text-secondary">
              Accent (Coral)
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-4">
              {Object.entries(colors.accent).map(([shade, color]) => (
                <div key={shade} className="text-center">
                  <div 
                    className="h-16 w-full rounded-md border border-muted"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs mt-2 text-secondary">
                    {shade}
                  </p>
                  <p className="text-xs text-muted">
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="space-y-4">
            <h3 className="text-heading-3 text-secondary">
              Semantic Colors
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div 
                  className="h-16 w-full rounded-md border border-muted"
                  style={{ backgroundColor: colors.success[500] }}
                />
                <p className="text-xs mt-2 text-secondary">
                  Success
                </p>
                <p className="text-xs text-muted">
                  {colors.success[500]}
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="h-16 w-full rounded-md border border-muted"
                  style={{ backgroundColor: colors.warning[500] }}
                />
                <p className="text-xs mt-2 text-secondary">
                  Warning
                </p>
                <p className="text-xs text-muted">
                  {colors.warning[500]}
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="h-16 w-full rounded-md border border-muted"
                  style={{ backgroundColor: colors.error[500] }}
                />
                <p className="text-xs mt-2 text-secondary">
                  Error
                </p>
                <p className="text-xs text-muted">
                  {colors.error[500]}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Scale */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            Typography Scale
          </h2>
          
          <div className="card-base p-6 space-y-4">
            <div className="flex items-baseline gap-4">
              <span className="text-heading-1 text-foreground">
                3xl (46px)
              </span>
              <span className="text-body-small text-secondary">
                Heading 1
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-heading-2 text-foreground">
                2xl (37px)
              </span>
              <span className="text-body-small text-secondary">
                Heading 2
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-heading-3 text-foreground">
                xl (30px)
              </span>
              <span className="text-body-small text-secondary">
                Heading 3
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-body-large text-foreground">
                lg (24px)
              </span>
              <span className="text-body-small text-secondary">
                Body Large
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-body text-foreground">
                base (18px)
              </span>
              <span className="text-body-small text-secondary">
                Body
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-body-small text-foreground">
                sm (15px)
              </span>
              <span className="text-body-small text-secondary">
                Body Small
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="text-caption text-foreground">
                xs (12px)
              </span>
              <span className="text-body-small text-secondary">
                Caption
              </span>
            </div>
          </div>
        </section>

        {/* Font Families */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            Font Families
          </h2>
          
          <div className="card-base p-6 space-y-4">
            <div>
              <p className="text-body-small text-muted mb-2">
                Brand Font (Rock Salt)
              </p>
              <p className="font-brand text-lg text-interactive-primary">
                Tattoo Directory
              </p>
            </div>
            <div>
              <p className="text-body-small text-muted mb-2">
                Heading Font (Merienda)
              </p>
              <p className="font-heading text-xl text-foreground">
                Find Your Perfect Artist
              </p>
            </div>
            <div>
              <p className="text-body-small text-muted mb-2">
                Body Font (Geist Sans)
              </p>
              <p className="font-body text-base text-secondary">
                This is the main body text used throughout the application for readability and clarity.
              </p>
            </div>
            <div>
              <p className="text-body-small text-muted mb-2">
                Mono Font (Geist Mono)
              </p>
              <p className="font-mono text-sm text-secondary">
                const artistId = &quot;artist-123&quot;;
              </p>
            </div>
          </div>
        </section>

        {/* Font Weights */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            Font Weights
          </h2>
          
          <div className="card-base p-6 space-y-2">
            <p className="text-base font-light text-secondary">
              Light (300) - Subtle emphasis
            </p>
            <p className="text-base font-normal text-secondary">
              Regular (400) - Default body text
            </p>
            <p className="text-base font-semibold text-secondary">
              Semibold (600) - Medium emphasis
            </p>
            <p className="text-base font-bold text-secondary">
              Bold (700) - Strong emphasis
            </p>
          </div>
        </section>

        {/* Spacing System */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            Spacing System
          </h2>
          
          <div className="card-base p-6 space-y-4">
            <p className="text-base text-secondary">
              Based on 4px/8px units
            </p>
            <div className="space-y-2">
              {[1, 2, 3, 4, 6, 8, 12, 16].map((size) => (
                <div key={size} className="flex items-center gap-4">
                  <div 
                    className="h-4 bg-interactive-primary"
                    style={{ width: `${size * 0.25}rem` }}
                  />
                  <span className="text-body-small text-secondary">
                    {size} ({size * 4}px)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Border Radius Scale */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            Border Radius Scale
          </h2>
          
          <div className="card-base p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'sm', value: '2px', class: 'rounded-sm' },
                { name: 'base', value: '4px', class: 'rounded' },
                { name: 'md', value: '8px', class: 'rounded-md' },
                { name: 'lg', value: '12px', class: 'rounded-lg' },
                { name: 'xl', value: '16px', class: 'rounded-xl' },
                { name: '2xl', value: '24px', class: 'rounded-2xl' },
                { name: '3xl', value: '32px', class: 'rounded-3xl' },
                { name: 'full', value: '9999px', class: 'rounded-full' },
              ].map((radius) => (
                <div key={radius.name} className="text-center">
                  <div 
                    className={`h-16 w-16 mx-auto bg-interactive-primary ${radius.class}`}
                  />
                  <p className="text-body-small text-secondary mt-2">
                    {radius.name}
                  </p>
                  <p className="text-caption text-muted">
                    {radius.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dark Mode Demonstration */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            Dark Mode Support
          </h2>
          
          <div className="card-base p-6">
            <p className="text-body text-secondary mb-4">
              All components automatically adapt to dark mode using CSS custom properties. 
              Toggle the dark mode button above to see the seamless color inversions with proper contrast ratios.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-heading-3 text-foreground">Light Mode Colors</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                    <span className="text-body-small text-secondary">Background: White</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4a474d' }}></div>
                    <span className="text-body-small text-secondary">Text: Dark Gray</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#bfc0c0' }}></div>
                    <span className="text-body-small text-secondary">Border: Light Gray</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-heading-3 text-foreground">Dark Mode Colors</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4a474d' }}></div>
                    <span className="text-body-small text-secondary">Background: Dark Gray</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ebebeb' }}></div>
                    <span className="text-body-small text-secondary">Text: Light Gray</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#636464' }}></div>
                    <span className="text-body-small text-secondary">Border: Medium Gray</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Badge Component System */}
        <section className="space-y-8">
          <h2 className="text-heading-2 font-heading text-foreground">
            Badge Component System
          </h2>
          
          <div className="space-y-8">
            {/* Badge Variants */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Badge Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="ghost">Ghost</Badge>
              </div>
            </div>

            {/* Badge Sizes */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Badge Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>

            {/* Badges with Icons */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Badges with Icons</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary" icon={<span>★</span>}>Featured</Badge>
                <Badge variant="success" icon={<span>✓</span>}>Verified</Badge>
                <Badge variant="warning" icon={<span>⚠</span>}>Warning</Badge>
                <Badge variant="error" icon={<span>✕</span>}>Error</Badge>
                <Badge variant="accent" icon={<span>🎨</span>} size="lg">Artist</Badge>
              </div>
            </div>

            {/* Badge Use Cases */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Badge Use Cases</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Artist Profile</CardTitle>
                      <Badge variant="success" icon={<span>✓</span>}>Verified</Badge>
                    </div>
                    <CardDescription>John Smith - Traditional Artist</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge variant="primary" size="sm">Traditional</Badge>
                        <Badge variant="primary" size="sm">Realism</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="accent" size="sm">5+ Years</Badge>
                        <Badge variant="outline" size="sm">Available</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Studio Listing</CardTitle>
                      <Badge variant="warning" icon={<span>⭐</span>}>Premium</Badge>
                    </div>
                    <CardDescription>Ink & Art Studio - London</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge variant="success" size="sm">Open</Badge>
                        <Badge variant="ghost" size="sm">Walk-ins</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">15 Artists</Badge>
                        <Badge variant="accent" size="sm">Est. 2010</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Tag Component System */}
        <section className="space-y-8">
          <h2 className="text-heading-2 font-heading text-foreground">
            Tag Component System
          </h2>
          
          <div className="space-y-8">
            {/* Tag Variants */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Tag Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Tag variant="primary">Primary</Tag>
                <Tag variant="secondary">Secondary</Tag>
                <Tag variant="accent">Accent</Tag>
                <Tag variant="success">Success</Tag>
                <Tag variant="warning">Warning</Tag>
                <Tag variant="error">Error</Tag>
                <Tag variant="neutral">Neutral</Tag>
              </div>
            </div>

            {/* Tag Sizes */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Tag Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Tag size="sm">Small</Tag>
                <Tag size="md">Medium</Tag>
                <Tag size="lg">Large</Tag>
              </div>
            </div>

            {/* Tags with Icons */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Tags with Icons</h3>
              <div className="flex flex-wrap gap-3">
                <Tag variant="primary" icon={<span>🎨</span>}>Traditional</Tag>
                <Tag variant="accent" icon={<span>📍</span>}>London</Tag>
                <Tag variant="success" icon={<span>⭐</span>}>Highly Rated</Tag>
                <Tag variant="neutral" icon={<span>🏢</span>}>Studio</Tag>
              </div>
            </div>

            {/* Removable Tags */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Removable Tags (Interactive)</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Style Filters:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Tag variant="primary" removable onRemove={() => console.log('Removed Traditional')}>
                      Traditional
                    </Tag>
                    <Tag variant="primary" removable onRemove={() => console.log('Removed Realism')}>
                      Realism
                    </Tag>
                    <Tag variant="primary" removable onRemove={() => console.log('Removed Blackwork')}>
                      Blackwork
                    </Tag>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Location Filters:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Tag variant="accent" removable onRemove={() => console.log('Removed London')}>
                      London
                    </Tag>
                    <Tag variant="accent" removable onRemove={() => console.log('Removed Manchester')}>
                      Manchester
                    </Tag>
                    <Tag variant="accent" removable onRemove={() => console.log('Removed Birmingham')}>
                      Birmingham
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags with Icons and Remove */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Tags with Icons and Remove</h3>
              <div className="flex flex-wrap gap-3">
                <Tag 
                  variant="primary" 
                  icon={<span>🎨</span>} 
                  removable 
                  onRemove={() => console.log('Removed Traditional')}
                >
                  Traditional
                </Tag>
                <Tag 
                  variant="accent" 
                  icon={<span>📍</span>} 
                  removable 
                  onRemove={() => console.log('Removed London')}
                >
                  London
                </Tag>
                <Tag 
                  variant="success" 
                  icon={<span>⭐</span>} 
                  removable 
                  onRemove={() => console.log('Removed Highly Rated')}
                >
                  Highly Rated
                </Tag>
              </div>
            </div>

            {/* Tag Use Cases */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Tag Use Cases</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Filters</CardTitle>
                    <CardDescription>Active filters for artist search</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Styles:</h5>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="primary" size="sm" removable onRemove={() => {}}>Traditional</Tag>
                          <Tag variant="primary" size="sm" removable onRemove={() => {}}>Realism</Tag>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Locations:</h5>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="accent" size="sm" removable onRemove={() => {}}>London</Tag>
                          <Tag variant="accent" size="sm" removable onRemove={() => {}}>Within 10 miles</Tag>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Other:</h5>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="success" size="sm" removable onRemove={() => {}}>Available Now</Tag>
                          <Tag variant="neutral" size="sm" removable onRemove={() => {}}>Verified</Tag>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">Clear All Filters</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Artist Specialties</CardTitle>
                    <CardDescription>Non-removable tags for display</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Primary Styles:</h5>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="primary" size="sm">Traditional</Tag>
                          <Tag variant="primary" size="sm">Japanese</Tag>
                          <Tag variant="primary" size="sm">Blackwork</Tag>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Experience:</h5>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="success" size="sm">10+ Years</Tag>
                          <Tag variant="accent" size="sm">Award Winner</Tag>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Availability:</h5>
                        <div className="flex flex-wrap gap-2">
                          <Tag variant="success" size="sm">Booking Open</Tag>
                          <Tag variant="neutral" size="sm">Consultations</Tag>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Accessibility Demo */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Accessibility Features</h3>
              <Card>
                <CardHeader>
                  <CardTitle>Keyboard Navigation</CardTitle>
                  <CardDescription>
                    Removable tags support keyboard navigation. Tab to focus, then use Delete or Backspace to remove.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Try tabbing through these removable tags and pressing Delete or Backspace:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Tag variant="primary" removable onRemove={() => alert('Tag removed!')}>
                        Tab + Delete
                      </Tag>
                      <Tag variant="accent" removable onRemove={() => alert('Tag removed!')}>
                        Tab + Backspace
                      </Tag>
                      <Tag variant="success" removable onRemove={() => alert('Tag removed!')}>
                        Keyboard Accessible
                      </Tag>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CSS Custom Properties Reference */}
        <section className="space-y-6">
          <h2 className="text-heading-2 font-heading text-foreground">
            CSS Custom Properties Reference
          </h2>
          
          <div className="card-base p-6">
            <p className="text-body text-secondary mb-6">
              All design tokens are available as CSS custom properties for consistent styling across components.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-heading-4 text-foreground mb-3">Semantic Colors</h4>
                <div className="space-y-1 font-mono text-xs text-muted">
                  <div>--background-primary</div>
                  <div>--text-primary</div>
                  <div>--border-primary</div>
                  <div>--interactive-primary</div>
                  <div>--feedback-success</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-heading-4 text-foreground mb-3">Typography</h4>
                <div className="space-y-1 font-mono text-xs text-muted">
                  <div>--font-size-base</div>
                  <div>--font-weight-semibold</div>
                  <div>--line-height-normal</div>
                  <div>--letter-spacing-normal</div>
                  <div>--font-family-body</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-heading-4 text-foreground mb-3">Spacing & Layout</h4>
                <div className="space-y-1 font-mono text-xs text-muted">
                  <div>--spacing-4</div>
                  <div>--radius-md</div>
                  <div>--shadow-md</div>
                  <div>--duration-200</div>
                  <div>--ease-out</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Loading Components */}
        <section className="space-y-8">
          <h2 className="text-heading-2 font-heading text-foreground">
            Skeleton Loading Components
          </h2>
          
          <div className="space-y-8">
            {/* Base Skeleton Components */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Base Skeleton Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Basic Skeleton</h4>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>

                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Avatar Variants</h4>
                  <div className="flex items-center gap-3">
                    <SkeletonVariants.Avatar size="sm" />
                    <SkeletonVariants.Avatar size="md" />
                    <SkeletonVariants.Avatar size="lg" />
                  </div>
                </div>

                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Text Variants</h4>
                  <div className="space-y-3">
                    <SkeletonVariants.Text lines={1} />
                    <SkeletonVariants.Text lines={3} />
                  </div>
                </div>

                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Button & Badge</h4>
                  <div className="space-y-3">
                    <SkeletonVariants.Button size="sm" />
                    <SkeletonVariants.Button size="md" />
                    <div className="flex gap-2">
                      <SkeletonVariants.Badge />
                      <SkeletonVariants.Badge />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Variants */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Image Skeleton Variants</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted mb-2">Square</p>
                  <SkeletonVariants.Image aspectRatio="square" />
                </div>
                <div>
                  <p className="text-sm text-muted mb-2">Video</p>
                  <SkeletonVariants.Image aspectRatio="video" />
                </div>
                <div>
                  <p className="text-sm text-muted mb-2">Portrait</p>
                  <SkeletonVariants.Image aspectRatio="portrait" />
                </div>
                <div>
                  <p className="text-sm text-muted mb-2">Landscape</p>
                  <SkeletonVariants.Image aspectRatio="landscape" />
                </div>
              </div>
            </div>

            {/* Artist Card Skeletons */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Artist Card Skeletons</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Single Artist Card</h4>
                  <div className="max-w-sm">
                    <ArtistCardSkeleton />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Artist Grid (3 cards)</h4>
                  <ArtistCardSkeletonGrid count={3} />
                </div>
              </div>
            </div>

            {/* Studio Cards */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Studio Cards</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Single Studio Card</h4>
                  <div className="max-w-md">
                    <StudioCard studio={mockStudios[0]} />
                  </div>
                </div>
                
                {/* Debug: Test Tailwind max-width classes */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Debug: Tailwind Max-Width Classes</h4>
                  <div className="flex gap-6 items-start">
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">max-w-xs (320px)</p>
                      <div className="max-w-xs bg-red-200 border-2 border-red-500 p-4 flex-shrink-0">
                        <p className="text-xs">This should be 320px max</p>
                        <p className="text-xs font-mono">Actual width: <span id="debug-xs-width">measuring...</span></p>
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">max-w-sm (384px)</p>
                      <div className="max-w-sm bg-blue-200 border-2 border-blue-500 p-4 flex-shrink-0">
                        <p className="text-xs">This should be 384px max</p>
                        <p className="text-xs font-mono">Actual width: <span id="debug-sm-width">measuring...</span></p>
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">max-w-lg (512px)</p>
                      <div className="max-w-lg bg-green-200 border-2 border-green-500 p-4 flex-shrink-0">
                        <p className="text-xs">This should be 512px max</p>
                        <p className="text-xs font-mono">Actual width: <span id="debug-lg-width">measuring...</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Debug: Test with explicit widths */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Debug: Explicit Width Test</h4>
                  <div className="flex gap-6 items-start">
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">320px explicit</p>
                      <div style={{width: '320px'}} className="bg-red-200 border-2 border-red-500 p-4">
                        <p className="text-xs">320px explicit width</p>
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">384px explicit</p>
                      <div style={{width: '384px'}} className="bg-blue-200 border-2 border-blue-500 p-4">
                        <p className="text-xs">384px explicit width</p>
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">512px explicit</p>
                      <div style={{width: '512px'}} className="bg-green-200 border-2 border-green-500 p-4">
                        <p className="text-xs">512px explicit width</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Studio Card Sizes - Block Layout</h4>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-neutral-600 mb-2 font-medium">Small (320px) - Block Layout</p>
                      <StudioCard studio={mockStudios[1]} size="sm" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 mb-2 font-medium">Medium (384px) - Block Layout</p>
                      <StudioCard studio={mockStudios[1]} size="md" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 mb-2 font-medium">Large (512px) - Block Layout</p>
                      <StudioCard studio={mockStudios[1]} size="lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Studio Card Sizes - Flex Layout (Fixed)</h4>
                  <div className="flex flex-wrap gap-6 items-start justify-start">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">Small (320px)</p>
                      <div className="border-2 border-red-500">
                        <StudioCard studio={mockStudios[1]} size="sm" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">Medium (384px)</p>
                      <div className="border-2 border-blue-500">
                        <StudioCard studio={mockStudios[1]} size="md" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <p className="text-sm text-neutral-600 mb-2 font-medium">Large (512px)</p>
                      <div className="border-2 border-green-500">
                        <StudioCard studio={mockStudios[1]} size="lg" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Studio Grid (2 cards)</h4>
                  <div className="flex flex-wrap gap-4 justify-start">
                    <div className="flex-shrink-0">
                      <StudioCard studio={mockStudios[0]} size="md" />
                    </div>
                    <div className="flex-shrink-0">
                      <StudioCard studio={mockStudios[1]} size="md" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Responsive Grid Layout</h4>
                  <p className="text-sm text-neutral-600 mb-4">
                    Cards in responsive grid containers (auto-fit with min-width constraints)
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
                    <StudioCard studio={mockStudios[0]} size="md" />
                    <StudioCard studio={mockStudios[1]} size="md" />
                    <StudioCard studio={mockStudios[2]} size="md" />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Compact Studio Cards</h4>
                  <div className="space-y-2 max-w-lg">
                    <StudioCardCompact studio={mockStudios[0]} />
                    <StudioCardCompact studio={mockStudios[1]} />
                    <StudioCardCompact studio={mockStudios[2]} />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Studio with Minimal Data</h4>
                  <div className="max-w-md">
                    <StudioCard studio={{
                      studioId: "studio-minimal",
                      studioName: "Minimal Studio",
                      locationDisplay: "London, UK",
                      artistCount: 2
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Card Skeletons */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Studio Card Skeletons</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Single Studio Card</h4>
                  <div className="max-w-md">
                    <StudioCardSkeleton />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Studio Grid (2 cards)</h4>
                  <StudioCardSkeletonGrid count={2} />
                </div>
              </div>
            </div>

            {/* Progressive Loading Examples */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Progressive Loading Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Progressive Image</h4>
                  <ProgressiveImage
                    src="https://picsum.photos/300/200"
                    alt="Progressive loading example"
                    width={300}
                    height={128}
                    className="w-full h-32 object-cover rounded"
                    skeletonClassName="w-full h-32"
                  />
                </div>

                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Content Placeholder</h4>
                  <ContentPlaceholder
                    isLoading={false}
                    skeleton={
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    }
                  >
                    <div className="space-y-3">
                      <p className="text-foreground">This is the actual content that appears after loading.</p>
                      <div className="bg-accent-100 p-4 rounded">
                        <p className="text-accent-800">Content loaded successfully!</p>
                      </div>
                    </div>
                  </ContentPlaceholder>
                </div>
              </div>
            </div>

            {/* Staggered Loading Demo */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Staggered Loading Animation</h3>
              <div className="card-base p-6">
                <p className="text-muted mb-4">Items appear with staggered animation (refresh page to see effect)</p>
                <StaggeredLoader delay={200} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card-base p-4">
                    <h4 className="font-semibold text-foreground">Item 1</h4>
                    <p className="text-muted">First item to appear</p>
                  </div>
                  <div className="card-base p-4">
                    <h4 className="font-semibold text-foreground">Item 2</h4>
                    <p className="text-muted">Second item to appear</p>
                  </div>
                  <div className="card-base p-4">
                    <h4 className="font-semibold text-foreground">Item 3</h4>
                    <p className="text-muted">Third item to appear</p>
                  </div>
                </StaggeredLoader>
              </div>
            </div>

            {/* Infinite Scroll Loader */}
            <div>
              <h3 className="text-heading-3 text-foreground mb-4">Infinite Scroll Loader</h3>
              <div className="space-y-4">
                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Loading State</h4>
                  <InfiniteScrollLoader isLoading={true} hasMore={true} />
                </div>
                
                <div className="card-base p-4">
                  <h4 className="text-lg font-semibold text-foreground mb-3">End State</h4>
                  <InfiniteScrollLoader isLoading={false} hasMore={false} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}