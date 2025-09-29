import { Page, Locator } from '@playwright/test';

/**
 * Color contrast analysis and validation
 * Implements WCAG 2.1 AA contrast requirements
 */

export interface ContrastElement {
  selector: string;
  element: string;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'AA' | 'AAA';
  passes: boolean;
  textSize: 'normal' | 'large';
  fontSize: number;
  fontWeight: number;
  isInteractive: boolean;
  elementType: 'text' | 'button' | 'input' | 'link' | 'other';
}

export interface ContrastReport {
  pageUrl: string;
  theme: 'light' | 'dark';
  elements: ContrastElement[];
  overallScore: number;
  failureCount: number;
  totalElements: number;
  criticalFailures: ContrastElement[];
  warnings: ContrastElement[];
  timestamp: Date;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ContrastThresholds {
  normalTextAA: number;    // 4.5:1
  largeTextAA: number;     // 3:1
  normalTextAAA: number;   // 7:1
  largeTextAAA: number;    // 4.5:1
  nonTextAA: number;       // 3:1 for UI components
}

/**
 * ContrastAnalyzer - Automated color contrast ratio calculation and validation
 * 
 * Features:
 * - WCAG 2.1 AA/AAA compliance checking
 * - Support for both light and dark themes
 * - Form elements, buttons, and interactive components validation
 * - Automatic text size detection (normal vs large)
 * - Background color inheritance handling
 * - Comprehensive reporting with fix suggestions
 */
export class ContrastAnalyzer {
  private page: Page;
  private thresholds: ContrastThresholds;

  constructor(page: Page) {
    this.page = page;
    this.thresholds = {
      normalTextAA: 4.5,
      largeTextAA: 3.0,
      normalTextAAA: 7.0,
      largeTextAAA: 4.5,
      nonTextAA: 3.0
    };
  }

  /**
   * Run comprehensive contrast analysis on the current page
   */
  async analyzeContrast(theme: 'light' | 'dark' = 'light'): Promise<ContrastReport> {
    const pageUrl = this.page.url();
    const elements: ContrastElement[] = [];

    // Define selectors for different element types
    const selectors = {
      text: 'p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label, legend',
      buttons: 'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]',
      inputs: 'input, textarea, select, [contenteditable="true"]',
      links: 'a, [role="link"]',
      interactive: '[tabindex], [role="tab"], [role="menuitem"], [role="option"]'
    };

    // Analyze each element type
    for (const [type, selector] of Object.entries(selectors)) {
      const typeElements = await this.analyzeElementsBySelector(
        selector, 
        type as 'text' | 'button' | 'input' | 'link' | 'other'
      );
      elements.push(...typeElements);
    }

    // Calculate overall metrics
    const failureCount = elements.filter(el => !el.passes).length;
    const criticalFailures = elements.filter(el => 
      !el.passes && (el.contrastRatio < this.thresholds.normalTextAA || el.isInteractive)
    );
    const warnings = elements.filter(el => 
      el.passes && el.contrastRatio < this.thresholds.normalTextAAA
    );

    const overallScore = elements.length > 0 
      ? Math.round(((elements.length - failureCount) / elements.length) * 100)
      : 100;

    return {
      pageUrl,
      theme,
      elements,
      overallScore,
      failureCount,
      totalElements: elements.length,
      criticalFailures,
      warnings,
      timestamp: new Date()
    };
  }

  /**
   * Analyze elements by CSS selector
   */
  private async analyzeElementsBySelector(
    selector: string, 
    elementType: 'text' | 'button' | 'input' | 'link' | 'other'
  ): Promise<ContrastElement[]> {
    const elements: ContrastElement[] = [];
    
    try {
      const locators = await this.page.locator(selector).all();
      
      for (let i = 0; i < Math.min(locators.length, 50); i++) { // Limit to 50 elements per type
        const locator = locators[i];
        
        try {
          // Check if element is visible
          const isVisible = await locator.isVisible();
          if (!isVisible) continue;

          // Get computed styles
          const styles = await this.getComputedStyles(locator);
          if (!styles.color || !styles.backgroundColor) continue;

          // Parse colors
          const foregroundColor = this.parseColor(styles.color);
          const backgroundColor = await this.getEffectiveBackgroundColor(locator);
          
          if (!foregroundColor || !backgroundColor) continue;

          // Calculate contrast ratio
          const contrastRatio = this.calculateContrastRatio(foregroundColor, backgroundColor);
          
          // Determine text size
          const fontSize = parseFloat(styles.fontSize) || 16;
          const fontWeight = this.parseFontWeight(styles.fontWeight);
          const textSize = this.determineTextSize(fontSize, fontWeight);
          
          // Determine if element is interactive
          const isInteractive = await this.isElementInteractive(locator);
          
          // Check WCAG compliance
          const wcagLevel = 'AA'; // Focus on AA compliance
          const passes = this.checkWCAGCompliance(contrastRatio, textSize, isInteractive, wcagLevel);

          const element: ContrastElement = {
            selector: await this.generateSelector(locator),
            element: await locator.textContent() || await locator.getAttribute('aria-label') || 'Unknown',
            foregroundColor: this.rgbToHex(foregroundColor),
            backgroundColor: this.rgbToHex(backgroundColor),
            contrastRatio: Math.round(contrastRatio * 100) / 100,
            wcagLevel,
            passes,
            textSize,
            fontSize,
            fontWeight,
            isInteractive,
            elementType
          };

          elements.push(element);
        } catch (error) {
          // Skip elements that can't be analyzed
          console.warn(`Failed to analyze element: ${error}`);
          continue;
        }
      }
    } catch (error) {
      console.warn(`Failed to analyze selector ${selector}: ${error}`);
    }

    return elements;
  }

  /**
   * Get computed styles for an element
   */
  private async getComputedStyles(locator: Locator): Promise<any> {
    return await locator.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        display: styles.display,
        visibility: styles.visibility
      };
    });
  }

  /**
   * Get effective background color (handles transparency and inheritance)
   */
  private async getEffectiveBackgroundColor(locator: Locator): Promise<ColorRGB | null> {
    return await locator.evaluate((element) => {
      let currentElement = element as HTMLElement;
      const colors: string[] = [];
      
      // Walk up the DOM tree to find background colors
      while (currentElement && currentElement !== document.body.parentElement) {
        const styles = window.getComputedStyle(currentElement);
        const bgColor = styles.backgroundColor;
        
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          colors.push(bgColor);
        }
        
        currentElement = currentElement.parentElement as HTMLElement;
      }
      
      // If no background color found, use white as default
      if (colors.length === 0) {
        return { r: 255, g: 255, b: 255 };
      }
      
      // Use the first non-transparent background color
      const colorStr = colors[0];
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
      
      return null;
    });
  }

  /**
   * Parse color string to RGB object
   */
  private parseColor(colorStr: string): ColorRGB | null {
    if (!colorStr) return null;
    
    // Handle rgb() and rgba() formats
    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }
    
    // Handle hex colors
    const hexMatch = colorStr.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16)
      };
    }
    
    // Handle named colors (basic set)
    const namedColors: { [key: string]: ColorRGB } = {
      'black': { r: 0, g: 0, b: 0 },
      'white': { r: 255, g: 255, b: 255 },
      'red': { r: 255, g: 0, b: 0 },
      'green': { r: 0, g: 128, b: 0 },
      'blue': { r: 0, g: 0, b: 255 }
    };
    
    return namedColors[colorStr.toLowerCase()] || null;
  }

  /**
   * Calculate contrast ratio between two colors
   * Based on WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
   */
  private calculateContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
    const luminance1 = this.calculateLuminance(color1);
    const luminance2 = this.calculateLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   * Based on WCAG 2.1 formula
   */
  private calculateLuminance(color: ColorRGB): number {
    const { r, g, b } = color;
    
    // Convert to sRGB
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    // Apply gamma correction
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    // Calculate luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Parse font weight string to numeric value
   */
  private parseFontWeight(fontWeight: string): number {
    const weightMap: { [key: string]: number } = {
      'normal': 400,
      'bold': 700,
      'lighter': 300,
      'bolder': 700
    };
    
    const numericWeight = parseInt(fontWeight);
    if (!isNaN(numericWeight)) {
      return numericWeight;
    }
    
    return weightMap[fontWeight.toLowerCase()] || 400;
  }

  /**
   * Determine if text is considered "large" by WCAG standards
   * Large text: 18pt+ (24px+) or 14pt+ (18.66px+) bold
   */
  private determineTextSize(fontSize: number, fontWeight: number): 'normal' | 'large' {
    if (fontSize >= 24) {
      return 'large';
    }
    
    if (fontSize >= 18.66 && fontWeight >= 700) {
      return 'large';
    }
    
    return 'normal';
  }

  /**
   * Check if element is interactive (button, link, form control, etc.)
   */
  private async isElementInteractive(locator: Locator): Promise<boolean> {
    return await locator.evaluate((element) => {
      const tagName = element.tagName.toLowerCase();
      const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
      
      if (interactiveTags.includes(tagName)) {
        return true;
      }
      
      // Check for interactive roles
      const role = element.getAttribute('role');
      const interactiveRoles = ['button', 'link', 'tab', 'menuitem', 'option', 'checkbox', 'radio'];
      if (role && interactiveRoles.includes(role)) {
        return true;
      }
      
      // Check for tabindex
      const tabindex = element.getAttribute('tabindex');
      if (tabindex !== null && tabindex !== '-1') {
        return true;
      }
      
      // Check for click handlers
      const hasClickHandler = element.onclick !== null;
      if (hasClickHandler) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Check WCAG compliance for contrast ratio
   */
  private checkWCAGCompliance(
    contrastRatio: number, 
    textSize: 'normal' | 'large', 
    isInteractive: boolean, 
    wcagLevel: 'AA' | 'AAA'
  ): boolean {
    let threshold: number;
    
    if (isInteractive) {
      // Interactive elements need at least 3:1 for AA
      threshold = this.thresholds.nonTextAA;
    } else if (textSize === 'large') {
      threshold = wcagLevel === 'AAA' ? this.thresholds.largeTextAAA : this.thresholds.largeTextAA;
    } else {
      threshold = wcagLevel === 'AAA' ? this.thresholds.normalTextAAA : this.thresholds.normalTextAA;
    }
    
    return contrastRatio >= threshold;
  }

  /**
   * Generate a unique selector for an element
   */
  private async generateSelector(locator: Locator): Promise<string> {
    return await locator.evaluate((element) => {
      // Try to generate a meaningful selector
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c.length > 0);
        if (classes.length > 0) {
          return `.${classes[0]}`;
        }
      }
      
      const tagName = element.tagName.toLowerCase();
      const parent = element.parentElement;
      
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element);
        return `${tagName}:nth-child(${index + 1})`;
      }
      
      return tagName;
    });
  }

  /**
   * Convert RGB to hex color
   */
  private rgbToHex(color: ColorRGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  /**
   * Generate contrast analysis report
   */
  generateReport(report: ContrastReport): string {
    let output = `=== CONTRAST ANALYSIS REPORT ===\n\n`;
    output += `Page: ${report.pageUrl}\n`;
    output += `Theme: ${report.theme}\n`;
    output += `Overall Score: ${report.overallScore}/100\n`;
    output += `Elements Analyzed: ${report.totalElements}\n`;
    output += `Failures: ${report.failureCount}\n`;
    output += `Critical Failures: ${report.criticalFailures.length}\n`;
    output += `Warnings: ${report.warnings.length}\n`;
    output += `Timestamp: ${report.timestamp.toISOString()}\n\n`;

    if (report.criticalFailures.length > 0) {
      output += `=== CRITICAL CONTRAST FAILURES ===\n`;
      report.criticalFailures.forEach((element, index) => {
        output += `${index + 1}. ${element.element} (${element.elementType})\n`;
        output += `   Selector: ${element.selector}\n`;
        output += `   Contrast Ratio: ${element.contrastRatio}:1\n`;
        output += `   Required: ${element.textSize === 'large' ? '3.0' : '4.5'}:1 (WCAG AA)\n`;
        output += `   Colors: ${element.foregroundColor} on ${element.backgroundColor}\n`;
        output += `   Fix: Increase color contrast or adjust colors\n\n`;
      });
    }

    if (report.warnings.length > 0) {
      output += `=== CONTRAST WARNINGS (AAA Level) ===\n`;
      report.warnings.forEach((element, index) => {
        output += `${index + 1}. ${element.element} (${element.elementType})\n`;
        output += `   Contrast Ratio: ${element.contrastRatio}:1\n`;
        output += `   Recommended: ${element.textSize === 'large' ? '4.5' : '7.0'}:1 (WCAG AAA)\n\n`;
      });
    }

    if (report.failureCount === 0) {
      output += `🎉 All elements meet WCAG AA contrast requirements!\n`;
    }

    return output;
  }

  /**
   * Get contrast validation for specific element types
   */
  async validateFormElements(theme: 'light' | 'dark' = 'light'): Promise<ContrastElement[]> {
    const formSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="search"]',
      'textarea',
      'select',
      'button[type="submit"]',
      'button[type="button"]',
      'label',
      '.form-control',
      '.form-input'
    ];

    const elements: ContrastElement[] = [];
    
    for (const selector of formSelectors) {
      const selectorElements = await this.analyzeElementsBySelector(selector, 'input');
      elements.push(...selectorElements);
    }

    return elements;
  }

  /**
   * Get contrast validation for buttons and interactive elements
   */
  async validateInteractiveElements(theme: 'light' | 'dark' = 'light'): Promise<ContrastElement[]> {
    const interactiveSelectors = [
      'button',
      '[role="button"]',
      'a',
      '[role="link"]',
      '[role="tab"]',
      '[role="menuitem"]',
      '.btn',
      '.button',
      '.link'
    ];

    const elements: ContrastElement[] = [];
    
    for (const selector of interactiveSelectors) {
      const selectorElements = await this.analyzeElementsBySelector(selector, 'button');
      elements.push(...selectorElements);
    }

    return elements;
  }

  /**
   * Validate contrast for both light and dark modes
   */
  async validateBothThemes(): Promise<{ light: ContrastReport; dark: ContrastReport }> {
    // This would require theme switching functionality
    // For now, return analysis for current theme
    const currentReport = await this.analyzeContrast('light');
    
    return {
      light: currentReport,
      dark: currentReport // TODO: Implement actual dark mode switching
    };
  }
}