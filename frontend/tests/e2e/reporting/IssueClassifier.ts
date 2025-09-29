/**
 * IssueClassifier - Categorizes issues by severity and impact
 * 
 * This class provides sophisticated issue classification based on multiple factors:
 * - Functional impact on user experience
 * - Accessibility compliance requirements
 * - Business impact and user journey disruption
 * - Technical complexity and fix effort estimation
 */

import { 
  Issue, 
  ClassifiedIssues, 
  IssueCategory, 
  ImpactAssessment, 
  ClassificationRules 
} from './types';

export class IssueClassifier {
  private rules: ClassificationRules;

  constructor(customRules?: Partial<ClassificationRules>) {
    this.rules = {
      accessibility: {
        critical: [
          'color-contrast',
          'keyboard-navigation',
          'focus-management',
          'form-labels',
          'heading-structure'
        ],
        major: [
          'aria-labels',
          'alt-text',
          'link-purpose',
          'button-name',
          'landmark-roles'
        ]
      },
      visual: {
        thresholds: {
          critical: 15.0, // 15% visual difference
          major: 5.0     // 5% visual difference
        }
      },
      contrast: {
        minimumRatios: {
          normal: 4.5,
          large: 3.0
        }
      },
      responsive: {
        minimumTouchTarget: 44,
        breakpoints: [320, 768, 1024, 1440]
      },
      ...customRules
    };
  }

  /**
   * Classify a collection of issues by severity with detailed analysis
   */
  classifyIssues(issues: Issue[]): ClassifiedIssues {
    const classifiedIssues = issues.map(issue => this.classifyIndividualIssue(issue));

    const critical = classifiedIssues.filter(issue => issue.severity === 'critical');
    const major = classifiedIssues.filter(issue => issue.severity === 'major');
    const minor = classifiedIssues.filter(issue => issue.severity === 'minor');

    return {
      critical,
      major,
      minor,
      total: classifiedIssues.length,
      distribution: {
        critical: critical.length,
        major: major.length,
        minor: minor.length
      }
    };
  }

  /**
   * Classify a single issue with detailed impact assessment
   */
  private classifyIndividualIssue(issue: Issue): Issue {
    // Create enhanced issue with classification data
    const enhancedIssue: Issue = {
      ...issue,
      category: this.categorizeIssue(issue),
      impact: this.assessImpact(issue)
    };

    // Determine severity based on multiple factors
    enhancedIssue.severity = this.determineSeverity(enhancedIssue);

    return enhancedIssue;
  }

  /**
   * Categorize issue by primary and secondary categories
   */
  private categorizeIssue(issue: Issue): IssueCategory {
    const tags: string[] = [];
    let primary: IssueCategory['primary'];
    let secondary: string | undefined;

    switch (issue.type) {
      case 'accessibility':
        primary = 'accessibility';
        secondary = this.getAccessibilitySubcategory(issue);
        tags.push('wcag', 'compliance');
        break;

      case 'visual':
        primary = 'visual';
        secondary = 'regression';
        tags.push('ui', 'layout');
        break;

      case 'contrast':
        primary = 'accessibility';
        secondary = 'color-contrast';
        tags.push('wcag', 'visibility');
        break;

      case 'responsive':
        primary = 'usability';
        secondary = 'mobile';
        tags.push('responsive', 'touch');
        break;

      case 'theme':
        primary = 'visual';
        secondary = 'theming';
        tags.push('dark-mode', 'consistency');
        break;

      default:
        primary = 'functionality';
    }

    // Add theme-specific tags
    if (issue.theme === 'dark') {
      tags.push('dark-mode');
    } else if (issue.theme === 'light') {
      tags.push('light-mode');
    }

    // Add page-specific tags
    if (issue.page.includes('search')) {
      tags.push('search');
    } else if (issue.page.includes('profile')) {
      tags.push('profile');
    } else if (issue.page.includes('auth')) {
      tags.push('authentication');
    }

    return {
      primary,
      secondary,
      tags
    };
  }

  /**
   * Assess the impact of an issue across multiple dimensions
   */
  private assessImpact(issue: Issue): ImpactAssessment {
    const userExperience = this.assessUserExperienceImpact(issue);
    const businessImpact = this.assessBusinessImpact(issue);
    const technicalComplexity = this.assessTechnicalComplexity(issue);
    const estimatedEffort = this.estimateFixEffort(issue);

    return {
      userExperience,
      businessImpact,
      technicalComplexity,
      estimatedEffort
    };
  }

  /**
   * Determine final severity based on all classification factors
   */
  private determineSeverity(issue: Issue): 'critical' | 'major' | 'minor' {
    const impact = issue.impact!;
    const category = issue.category!;

    // Critical severity conditions
    if (this.isCriticalIssue(issue, impact, category)) {
      return 'critical';
    }

    // Major severity conditions
    if (this.isMajorIssue(issue, impact, category)) {
      return 'major';
    }

    // Default to minor
    return 'minor';
  }

  /**
   * Check if issue qualifies as critical severity
   */
  private isCriticalIssue(issue: Issue, impact: ImpactAssessment, category: IssueCategory): boolean {
    // Functionality blockers are always critical
    if (category.primary === 'functionality' && impact.userExperience === 'high') {
      return true;
    }

    // Critical accessibility violations
    if (issue.type === 'accessibility' && this.isCriticalAccessibilityViolation(issue)) {
      return true;
    }

    // Severe visual regressions
    if (issue.type === 'visual' && this.isSevereVisualRegression(issue)) {
      return true;
    }

    // Critical contrast failures
    if (issue.type === 'contrast' && this.isCriticalContrastFailure(issue)) {
      return true;
    }

    // High business impact with high user experience impact
    if (impact.businessImpact === 'high' && impact.userExperience === 'high') {
      return true;
    }

    return false;
  }

  /**
   * Check if issue qualifies as major severity
   */
  private isMajorIssue(issue: Issue, impact: ImpactAssessment, category: IssueCategory): boolean {
    // High user experience impact
    if (impact.userExperience === 'high') {
      return true;
    }

    // Medium business impact with medium+ user experience impact
    if (impact.businessImpact === 'medium' && impact.userExperience !== 'low') {
      return true;
    }

    // Accessibility violations that don't block functionality
    if (issue.type === 'accessibility' && !this.isCriticalAccessibilityViolation(issue)) {
      return true;
    }

    // Responsive issues affecting usability
    if (issue.type === 'responsive' && category.secondary === 'mobile') {
      return true;
    }

    // Theme issues affecting core pages
    if (issue.type === 'theme' && this.isCorePageIssue(issue)) {
      return true;
    }

    return false;
  }

  // Helper methods for specific issue type analysis

  private getAccessibilitySubcategory(issue: Issue): string {
    const description = issue.description.toLowerCase();
    
    if (description.includes('contrast')) return 'color-contrast';
    if (description.includes('keyboard') || description.includes('focus')) return 'keyboard-navigation';
    if (description.includes('aria') || description.includes('label')) return 'aria-labels';
    if (description.includes('heading')) return 'heading-structure';
    if (description.includes('form')) return 'form-accessibility';
    if (description.includes('image') || description.includes('alt')) return 'image-accessibility';
    
    return 'general';
  }

  private assessUserExperienceImpact(issue: Issue): 'high' | 'medium' | 'low' {
    // Critical functionality issues
    if (issue.description.includes('cannot') || issue.description.includes('blocked')) {
      return 'high';
    }

    // Accessibility issues affecting core interactions
    if (issue.type === 'accessibility' && this.isCriticalAccessibilityViolation(issue)) {
      return 'high';
    }

    // Visual regressions on key pages
    if (issue.type === 'visual' && this.isCorePageIssue(issue)) {
      return 'medium';
    }

    // Responsive issues affecting mobile users
    if (issue.type === 'responsive') {
      return 'medium';
    }

    // Theme issues
    if (issue.type === 'theme') {
      return 'low';
    }

    return 'low';
  }

  private assessBusinessImpact(issue: Issue): 'high' | 'medium' | 'low' {
    // Issues on conversion-critical pages
    if (this.isConversionCriticalPage(issue.page)) {
      return 'high';
    }

    // Accessibility compliance issues (legal risk)
    if (issue.type === 'accessibility') {
      return 'high';
    }

    // Search functionality issues
    if (issue.page.includes('search') && issue.type !== 'theme') {
      return 'medium';
    }

    // Profile/portfolio issues
    if (issue.page.includes('profile') || issue.page.includes('portfolio')) {
      return 'medium';
    }

    return 'low';
  }

  private assessTechnicalComplexity(issue: Issue): 'high' | 'medium' | 'low' {
    // Visual regressions might require design changes
    if (issue.type === 'visual' && issue.description.includes('layout')) {
      return 'high';
    }

    // Complex accessibility fixes
    if (issue.type === 'accessibility' && issue.description.includes('structure')) {
      return 'high';
    }

    // Responsive issues requiring layout changes
    if (issue.type === 'responsive' && issue.description.includes('layout')) {
      return 'medium';
    }

    // Theme issues usually require CSS changes
    if (issue.type === 'theme') {
      return 'medium';
    }

    // Contrast issues are usually simple CSS fixes
    if (issue.type === 'contrast') {
      return 'low';
    }

    return 'medium';
  }

  private estimateFixEffort(issue: Issue): 'hours' | 'days' | 'weeks' {
    const complexity = this.assessTechnicalComplexity(issue);
    const impact = this.assessUserExperienceImpact(issue);

    // High complexity issues
    if (complexity === 'high') {
      return impact === 'high' ? 'weeks' : 'days';
    }

    // Medium complexity issues
    if (complexity === 'medium') {
      return impact === 'high' ? 'days' : 'hours';
    }

    // Low complexity issues
    return 'hours';
  }

  private isCriticalAccessibilityViolation(issue: Issue): boolean {
    const criticalViolations = this.rules.accessibility.critical;
    return criticalViolations.some(violation => 
      issue.description.toLowerCase().includes(violation.replace('-', ' '))
    );
  }

  private isSevereVisualRegression(issue: Issue): boolean {
    const match = issue.description.match(/(\d+(?:\.\d+)?)% difference/);
    if (match) {
      const percentage = parseFloat(match[1]);
      return percentage > this.rules.visual.thresholds.critical;
    }
    return false;
  }

  private isCriticalContrastFailure(issue: Issue): boolean {
    const match = issue.description.match(/(\d+(?:\.\d+)?):1/);
    if (match) {
      const ratio = parseFloat(match[1]);
      return ratio < 3.0; // Below minimum for any text size
    }
    return false;
  }

  private isCorePageIssue(issue: Issue): boolean {
    const corePages = ['/', '/search', '/auth/login', '/auth/signup'];
    return corePages.some(page => issue.page.includes(page));
  }

  private isConversionCriticalPage(pageUrl: string): boolean {
    const conversionPages = ['/auth/signup', '/auth/login', '/search', '/contact'];
    return conversionPages.some(page => pageUrl.includes(page));
  }

  /**
   * Get classification statistics for reporting
   */
  getClassificationStats(classifiedIssues: ClassifiedIssues): {
    severityDistribution: { [key: string]: number };
    typeDistribution: { [key: string]: number };
    impactDistribution: { [key: string]: number };
  } {
    const allIssues = [...classifiedIssues.critical, ...classifiedIssues.major, ...classifiedIssues.minor];

    const severityDistribution = {
      critical: classifiedIssues.critical.length,
      major: classifiedIssues.major.length,
      minor: classifiedIssues.minor.length
    };

    const typeDistribution: { [key: string]: number } = {};
    const impactDistribution: { [key: string]: number } = {};

    for (const issue of allIssues) {
      // Type distribution
      typeDistribution[issue.type] = (typeDistribution[issue.type] || 0) + 1;

      // Impact distribution
      if (issue.impact) {
        const impactKey = `${issue.impact.userExperience}-ux`;
        impactDistribution[impactKey] = (impactDistribution[impactKey] || 0) + 1;
      }
    }

    return {
      severityDistribution,
      typeDistribution,
      impactDistribution
    };
  }
}