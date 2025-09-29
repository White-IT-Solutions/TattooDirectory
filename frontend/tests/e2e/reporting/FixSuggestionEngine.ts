/**
 * FixSuggestionEngine - Provides actionable fix recommendations
 * 
 * This class analyzes issues and generates specific, actionable fix suggestions
 * with code examples, best practices, and resource links to help developers
 * resolve UI/UX issues efficiently.
 */

import { Issue, FixSuggestion, Resource } from './types';

export class FixSuggestionEngine {
  private knowledgeBase: Map<string, FixSuggestionTemplate>;

  constructor() {
    this.knowledgeBase = new Map();
    this.initializeKnowledgeBase();
  }

  /**
   * Generate fix suggestions for a collection of issues
   */
  generateFixSuggestions(issues: Issue[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    for (const issue of issues) {
      const suggestion = this.generateFixSuggestion(issue);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Sort by priority and severity
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate a fix suggestion for a single issue
   */
  private generateFixSuggestion(issue: Issue): FixSuggestion | null {
    const template = this.findBestTemplate(issue);
    if (!template) {
      return this.generateGenericSuggestion(issue);
    }

    return {
      issueId: issue.id,
      title: template.title,
      description: this.personalizeDescription(template.description, issue),
      codeExample: this.personalizeCodeExample(template.codeExample, issue),
      resources: template.resources,
      priority: this.determinePriority(issue),
      estimatedEffort: issue.impact?.estimatedEffort || 'hours',
      category: template.category
    };
  }

  /**
   * Find the best matching template for an issue
   */
  private findBestTemplate(issue: Issue): FixSuggestionTemplate | undefined {
    // Try exact match first
    const exactKey = `${issue.type}-${this.extractIssueSubtype(issue)}`;
    if (this.knowledgeBase.has(exactKey)) {
      return this.knowledgeBase.get(exactKey);
    }

    // Try type-based match
    const typeKey = issue.type;
    if (this.knowledgeBase.has(typeKey)) {
      return this.knowledgeBase.get(typeKey);
    }

    // Try pattern matching
    for (const [key, template] of this.knowledgeBase) {
      if (template.patterns.some(pattern => issue.description.toLowerCase().includes(pattern))) {
        return template;
      }
    }

    return undefined;
  }

  /**
   * Extract issue subtype from description for more specific matching
   */
  private extractIssueSubtype(issue: Issue): string {
    const description = issue.description.toLowerCase();

    // Accessibility subtypes
    if (issue.type === 'accessibility') {
      if (description.includes('contrast')) return 'contrast';
      if (description.includes('keyboard') || description.includes('focus')) return 'keyboard';
      if (description.includes('aria') || description.includes('label')) return 'aria';
      if (description.includes('heading')) return 'heading';
      if (description.includes('form')) return 'form';
      if (description.includes('image') || description.includes('alt')) return 'image';
    }

    // Visual subtypes
    if (issue.type === 'visual') {
      if (description.includes('layout')) return 'layout';
      if (description.includes('color')) return 'color';
      if (description.includes('text')) return 'text';
      if (description.includes('button')) return 'button';
    }

    // Responsive subtypes
    if (issue.type === 'responsive') {
      if (description.includes('touch')) return 'touch';
      if (description.includes('overflow')) return 'overflow';
      if (description.includes('layout')) return 'layout';
    }

    // Theme subtypes
    if (issue.type === 'theme') {
      if (description.includes('transition')) return 'transition';
      if (description.includes('color')) return 'color';
      if (description.includes('visibility')) return 'visibility';
    }

    return 'general';
  }

  /**
   * Personalize description with issue-specific details
   */
  private personalizeDescription(template: string, issue: Issue): string {
    return template
      .replace('{element}', issue.element || 'element')
      .replace('{page}', this.getPageName(issue.page))
      .replace('{theme}', issue.theme || 'both themes')
      .replace('{description}', issue.description);
  }

  /**
   * Personalize code example with issue-specific details
   */
  private personalizeCodeExample(template: string | undefined, issue: Issue): string | undefined {
    if (!template) return undefined;

    return template
      .replace('{selector}', issue.element || '.element')
      .replace('{theme}', issue.theme || 'dark');
  }

  /**
   * Determine priority based on issue severity and impact
   */
  private determinePriority(issue: Issue): 'high' | 'medium' | 'low' {
    if (issue.severity === 'critical') return 'high';
    if (issue.severity === 'major') return 'medium';
    return 'low';
  }

  /**
   * Generate a generic suggestion when no specific template matches
   */
  private generateGenericSuggestion(issue: Issue): FixSuggestion {
    return {
      issueId: issue.id,
      title: `Fix ${issue.type} issue`,
      description: `Address the ${issue.type} issue: ${issue.description}`,
      priority: this.determinePriority(issue),
      estimatedEffort: issue.impact?.estimatedEffort || 'hours',
      category: 'general',
      resources: [
        {
          title: 'Web Accessibility Guidelines',
          url: 'https://www.w3.org/WAI/WCAG21/quickref/',
          type: 'documentation'
        }
      ]
    };
  }

  /**
   * Get readable page name from URL
   */
  private getPageName(pageUrl: string): string {
    try {
      const url = new URL(pageUrl);
      const pathname = url.pathname;
      if (pathname === '/' || pathname === '') return 'home page';
      return pathname.split('/').filter(Boolean).join(' ');
    } catch {
      return 'page';
    }
  }

  /**
   * Initialize the knowledge base with fix suggestion templates
   */
  private initializeKnowledgeBase(): void {
    // Accessibility fix suggestions
    this.knowledgeBase.set('accessibility-contrast', {
      title: 'Fix Color Contrast Ratio',
      description: 'Improve color contrast on {element} to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).',
      codeExample: `/* Fix contrast by adjusting colors */
{selector} {
  /* Current colors have insufficient contrast */
  color: #333333; /* Dark text for better contrast */
  background-color: #ffffff; /* Light background */
}

/* For dark theme */
[data-theme="dark"] {selector} {
  color: #ffffff; /* Light text */
  background-color: #1a1a1a; /* Dark background */
}`,
      category: 'css',
      patterns: ['contrast', 'ratio'],
      resources: [
        {
          title: 'WebAIM Contrast Checker',
          url: 'https://webaim.org/resources/contrastchecker/',
          type: 'tool'
        },
        {
          title: 'WCAG Color Contrast Guidelines',
          url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
          type: 'documentation'
        }
      ]
    });

    this.knowledgeBase.set('accessibility-keyboard', {
      title: 'Improve Keyboard Navigation',
      description: 'Add proper keyboard navigation support and focus indicators for {element}.',
      codeExample: `/* Add visible focus indicators */
{selector}:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Ensure interactive elements are keyboard accessible */
{selector} {
  cursor: pointer;
  /* Add tabindex if needed */
  tabindex: 0;
}

/* Handle keyboard events */
{selector}.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    // Trigger action
  }
});`,
      category: 'javascript',
      patterns: ['keyboard', 'focus', 'navigation'],
      resources: [
        {
          title: 'Keyboard Navigation Best Practices',
          url: 'https://webaim.org/techniques/keyboard/',
          type: 'documentation'
        }
      ]
    });

    this.knowledgeBase.set('accessibility-aria', {
      title: 'Add ARIA Labels and Roles',
      description: 'Add proper ARIA labels and roles to {element} for screen reader accessibility.',
      codeExample: `<!-- Add descriptive ARIA labels -->
<button aria-label="Search for tattoo artists" aria-describedby="search-help">
  Search
</button>
<div id="search-help" class="sr-only">
  Enter location or artist name to find tattoo artists
</div>

<!-- Add proper roles for custom components -->
<div role="button" tabindex="0" aria-pressed="false">
  Custom Button
</div>

<!-- Add landmark roles -->
<nav role="navigation" aria-label="Main navigation">
  <!-- Navigation items -->
</nav>`,
      category: 'html',
      patterns: ['aria', 'label', 'role'],
      resources: [
        {
          title: 'ARIA Authoring Practices Guide',
          url: 'https://www.w3.org/WAI/ARIA/apg/',
          type: 'documentation'
        }
      ]
    });

    // Visual regression fix suggestions
    this.knowledgeBase.set('visual-layout', {
      title: 'Fix Layout Regression',
      description: 'Restore the expected layout for {element} on {page}.',
      codeExample: `/* Check for CSS changes that might have caused the regression */
{selector} {
  /* Ensure proper positioning */
  position: relative;
  
  /* Check flexbox/grid properties */
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  /* Verify spacing */
  margin: 1rem 0;
  padding: 1rem;
  
  /* Check for overflow issues */
  overflow: hidden;
}

/* Responsive considerations */
@media (max-width: 768px) {
  {selector} {
    flex-direction: column;
    gap: 0.5rem;
  }
}`,
      category: 'css',
      patterns: ['layout', 'positioning', 'regression'],
      resources: [
        {
          title: 'CSS Layout Debugging',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Debug_CSS',
          type: 'documentation'
        }
      ]
    });

    // Responsive fix suggestions
    this.knowledgeBase.set('responsive-touch', {
      title: 'Fix Touch Target Size',
      description: 'Increase touch target size for {element} to meet minimum 44px requirement.',
      codeExample: `/* Ensure minimum touch target size */
{selector} {
  min-height: 44px;
  min-width: 44px;
  
  /* Add padding if content is smaller */
  padding: 12px 16px;
  
  /* Ensure proper spacing between touch targets */
  margin: 8px;
  
  /* Make sure the entire area is clickable */
  display: inline-block;
  cursor: pointer;
}

/* For icon-only buttons */
{selector}.icon-only {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
      category: 'css',
      patterns: ['touch', 'target', 'size', '44px'],
      resources: [
        {
          title: 'Touch Target Guidelines',
          url: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html',
          type: 'documentation'
        }
      ]
    });

    // Theme fix suggestions
    this.knowledgeBase.set('theme-color', {
      title: 'Fix Dark Mode Colors',
      description: 'Ensure proper color theming for {element} in {theme} mode.',
      codeExample: `/* Define CSS custom properties for theming */
:root {
  --text-primary: #333333;
  --text-secondary: #666666;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --border-color: #e0e0e0;
}

[data-theme="dark"] {
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --border-color: #404040;
}

/* Apply theme colors */
{selector} {
  color: var(--text-primary);
  background-color: var(--bg-primary);
  border-color: var(--border-color);
  
  /* Smooth transitions */
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}`,
      category: 'css',
      patterns: ['dark mode', 'theme', 'color'],
      resources: [
        {
          title: 'Dark Mode Best Practices',
          url: 'https://web.dev/prefers-color-scheme/',
          type: 'documentation'
        }
      ]
    });

    this.knowledgeBase.set('theme-transition', {
      title: 'Improve Theme Transitions',
      description: 'Add smooth transitions when switching between light and dark themes.',
      codeExample: `/* Add smooth transitions for theme switching */
* {
  transition: 
    color 0.2s ease-in-out,
    background-color 0.2s ease-in-out,
    border-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

/* Prevent transitions on page load */
.no-transition * {
  transition: none !important;
}

/* JavaScript to handle theme switching */
function switchTheme(theme) {
  // Temporarily disable transitions
  document.body.classList.add('no-transition');
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', theme);
  
  // Re-enable transitions after a brief delay
  setTimeout(() => {
    document.body.classList.remove('no-transition');
  }, 100);
}`,
      category: 'css',
      patterns: ['transition', 'smooth', 'switching'],
      resources: [
        {
          title: 'CSS Transitions Guide',
          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions',
          type: 'documentation'
        }
      ]
    });

    // Contrast-specific suggestions
    this.knowledgeBase.set('contrast', {
      title: 'Improve Color Contrast',
      description: 'Adjust colors to meet WCAG contrast requirements for {element}.',
      codeExample: `/* Calculate and apply proper contrast ratios */
{selector} {
  /* For normal text: minimum 4.5:1 ratio */
  color: #212529; /* Dark gray on white background */
  background-color: #ffffff;
}

/* For large text (18pt+ or 14pt+ bold): minimum 3:1 ratio */
{selector}.large-text {
  color: #495057; /* Lighter gray acceptable for large text */
}

/* Dark theme versions */
[data-theme="dark"] {selector} {
  color: #f8f9fa; /* Light text */
  background-color: #212529; /* Dark background */
}

[data-theme="dark"] {selector}.large-text {
  color: #dee2e6; /* Slightly darker light text */
}`,
      category: 'css',
      patterns: ['contrast', 'color', 'wcag'],
      resources: [
        {
          title: 'Contrast Ratio Calculator',
          url: 'https://contrast-ratio.com/',
          type: 'tool'
        }
      ]
    });
  }

  /**
   * Get suggestions grouped by category for better organization
   */
  getSuggestionsByCategory(suggestions: FixSuggestion[]): { [category: string]: FixSuggestion[] } {
    const grouped: { [category: string]: FixSuggestion[] } = {};

    for (const suggestion of suggestions) {
      if (!grouped[suggestion.category]) {
        grouped[suggestion.category] = [];
      }
      grouped[suggestion.category].push(suggestion);
    }

    return grouped;
  }

  /**
   * Get suggestions grouped by priority for task planning
   */
  getSuggestionsByPriority(suggestions: FixSuggestion[]): { [priority: string]: FixSuggestion[] } {
    const grouped: { [priority: string]: FixSuggestion[] } = {
      high: [],
      medium: [],
      low: []
    };

    for (const suggestion of suggestions) {
      grouped[suggestion.priority].push(suggestion);
    }

    return grouped;
  }
}

// Internal interface for fix suggestion templates
interface FixSuggestionTemplate {
  title: string;
  description: string;
  codeExample?: string;
  category: 'css' | 'html' | 'javascript' | 'design' | 'content' | 'general';
  patterns: string[];
  resources: Resource[];
}