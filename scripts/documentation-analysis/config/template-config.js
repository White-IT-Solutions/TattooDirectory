/**
 * Configuration for documentation templates
 * Defines structure, requirements, and validation rules for each template
 */

const templateConfig = {
    README: {
        description: 'Main project documentation entry point',
        category: 'core',
        requiredSections: [
            'Overview', 
            'Features',
            'Architecture',
            'Getting Started',
            'Documentation',
            'Contributing',
            'Support'
        ],
        requiredVariables: [
            'PROJECT_NAME',
            'PROJECT_DESCRIPTION',
            'OVERVIEW_DESCRIPTION',
            'ARCHITECTURE_OVERVIEW',
            'QUICK_SETUP_COMMANDS',
            'TEST_COMMAND',
            'CONTRIBUTING_GUIDELINES',
            'LICENSE_INFO',
            'LAST_UPDATED',
            'VERSION'
        ],
        optionalSections: [
            'FEATURES',
            'TECH_STACK',
            'PREREQUISITES',
            'COMMUNITY_LINKS'
        ],
        validationRules: {
            maxLength: 50000,
            requireTableOfContents: true,
            requireQuickStartLink: true,
            requireArchitectureDiagram: true
        }
    },

    QUICK_START: {
        description: '5-minute setup guide for new developers',
        category: 'setup',
        requiredSections: [
            'Prerequisites',
            '5-Minute Setup',
            'Verification Checklist',
            'What\'s Next',
            'Need Help'
        ],
        requiredVariables: [
            'PROJECT_NAME',
            'REPOSITORY_URL',
            'PROJECT_DIRECTORY',
            'INSTALL_COMMAND',
            'ENV_SETUP_COMMAND',
            'HEALTH_CHECK_COMMAND',
            'TEST_COMMAND',
            'FRONTEND_URL'
        ],
        optionalSections: [
            'PREREQUISITES',
            'SETUP_SCENARIOS',
            'FIRST_TASKS',
            'SERVICES',
            'VERIFICATION_STEPS',
            'QUICK_FIXES'
        ],
        validationRules: {
            maxLength: 15000,
            requireCodeBlocks: true,
            requireVerificationSteps: true,
            maxSetupTime: '5 minutes'
        }
    },

    DEVELOPMENT_GUIDE: {
        description: 'Comprehensive development environment and workflow guide',
        category: 'development',
        requiredSections: [
            'Development Environment',
            'Project Structure', 
            'Development Workflow',
            'Code Standards',
            'Testing',
            'Debugging',
            'Performance',
            'Deployment'
        ],
        requiredVariables: [
            'PROJECT_NAME',
            'PROJECT_STRUCTURE',
            'LOCAL_INSTALL_COMMANDS',
            'DEV_START_COMMAND',
            'TEST_COMMANDS',
            'BUILD_COMMANDS',
            'LINT_COMMANDS',
            'LAST_UPDATED',
            'MAINTAINERS'
        ],
        optionalSections: [
            'SYSTEM_REQUIREMENTS',
            'VSCODE_EXTENSIONS',
            'KEY_DIRECTORIES',
            'NAMING_CONVENTIONS',
            'DEV_PROCESS_STEPS',
            'LANGUAGE_STANDARDS',
            'QUALITY_TOOLS',
            'ARCHITECTURE_PATTERNS',
            'TEST_TYPES',
            'DEBUG_TOOLS',
            'PERFORMANCE_TARGETS',
            'DEPLOYMENT_ENVIRONMENTS'
        ],
        validationRules: {
            maxLength: 75000,
            requireTableOfContents: true,
            requireCodeExamples: true,
            requireTestingSection: true
        }
    },

    API_REFERENCE: {
        description: 'Complete API documentation with endpoints and examples',
        category: 'reference',
        requiredSections: [
            'Overview',
            'Authentication',
            'Base URLs',
            'Response Format',
            'Error Handling',
            'API Endpoints',
            'Data Models',
            'Examples'
        ],
        requiredVariables: [
            'PROJECT_NAME',
            'API_VERSION',
            'BASE_URL',
            'API_OVERVIEW_DESCRIPTION',
            'AUTHENTICATION_DESCRIPTION',
            'SUCCESS_DATA_EXAMPLE',
            'TIMESTAMP_FORMAT',
            'ERROR_CODE',
            'ERROR_MESSAGE',
            'LAST_UPDATED'
        ],
        optionalSections: [
            'SUPPORTED_FORMATS',
            'AUTH_METHODS',
            'BASE_URLS',
            'HTTP_STATUS_CODES',
            'ERROR_CODES',
            'RATE_LIMITS',
            'API_SECTIONS',
            'DATA_MODELS',
            'USE_CASES',
            'SDK_EXAMPLES',
            'WEBHOOK_EVENTS'
        ],
        validationRules: {
            maxLength: 100000,
            requireTableOfContents: true,
            requireExamples: true,
            requireErrorHandling: true,
            requireDataModels: true
        }
    },

    TROUBLESHOOTING: {
        description: 'Common issues and solutions guide',
        category: 'support',
        requiredSections: [
            'Quick Diagnostics',
            'Setup Issues',
            'Development Issues', 
            'Runtime Issues',
            'Getting Help'
        ],
        requiredVariables: [
            'PROJECT_NAME',
            'HEALTH_CHECK_COMMAND',
            'SERVICE_STATUS_COMMAND',
            'DEPENDENCY_CHECK_COMMAND',
            'CONFIG_VALIDATION_COMMAND',
            'DIAGNOSTIC_COMMAND',
            'INFO_GATHERING_COMMAND',
            'LAST_UPDATED'
        ],
        optionalSections: [
            'QUICK_FIXES',
            'INSTALLATION_ISSUES',
            'ENV_CONFIG_ISSUES',
            'DEPENDENCY_ISSUES',
            'BUILD_ISSUES',
            'TEST_ISSUES',
            'CONNECTION_ISSUES',
            'API_ERRORS',
            'AUTH_ISSUES',
            'PERFORMANCE_ISSUES',
            'MEMORY_ISSUES',
            'DEPLOYMENT_ISSUES',
            'DATABASE_ISSUES',
            'WINDOWS_ISSUES',
            'DOCKER_ISSUES',
            'DEBUG_TOOLS',
            'LOG_PATTERNS',
            'HELP_CHANNELS',
            'MAINTENANCE_TASKS'
        ],
        validationRules: {
            maxLength: 80000,
            requireTableOfContents: true,
            requireDiagnosticCommands: true,
            requireHelpChannels: true
        }
    }
};

/**
 * Get configuration for a specific template
 * @param {string} templateName - Name of the template
 * @returns {Object|null} Template configuration or null if not found
 */
function getTemplateConfig(templateName) {
    return templateConfig[templateName] || null;
}

/**
 * Get all available template configurations
 * @returns {Object} All template configurations
 */
function getAllTemplateConfigs() {
    return templateConfig;
}

/**
 * Get templates by category
 * @param {string} category - Template category
 * @returns {Object} Templates in the specified category
 */
function getTemplatesByCategory(category) {
    const filtered = {};
    for (const [name, config] of Object.entries(templateConfig)) {
        if (config.category === category) {
            filtered[name] = config;
        }
    }
    return filtered;
}

/**
 * Validate template against its configuration
 * @param {string} templateName - Name of the template
 * @param {string} content - Template content
 * @returns {Object} Validation result
 */
function validateTemplateAgainstConfig(templateName, content) {
    const config = getTemplateConfig(templateName);
    if (!config) {
        return {
            valid: false,
            issues: [`No configuration found for template: ${templateName}`]
        };
    }

    const issues = [];
    
    // Check required sections
    for (const section of config.requiredSections) {
        const sectionRegex = new RegExp(`#{1,6}\\s*${section}`, 'i');
        if (!sectionRegex.test(content)) {
            issues.push(`Missing required section: ${section}`);
        }
    }

    // Check required variables
    for (const variable of config.requiredVariables) {
        const variableRegex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
        if (!variableRegex.test(content)) {
            issues.push(`Missing required variable: ${variable}`);
        }
    }

    // Check validation rules
    if (config.validationRules) {
        const rules = config.validationRules;
        
        if (rules.maxLength && content.length > rules.maxLength) {
            issues.push(`Template exceeds maximum length: ${content.length} > ${rules.maxLength}`);
        }

        if (rules.requireTableOfContents) {
            const tocRegex = /table of contents/i;
            if (!tocRegex.test(content)) {
                issues.push('Template should include a table of contents');
            }
        }

        if (rules.requireCodeBlocks) {
            const codeBlockRegex = /```[\s\S]*?```/;
            if (!codeBlockRegex.test(content)) {
                issues.push('Template should include code examples');
            }
        }

        if (rules.requireExamples && templateName === 'API_REFERENCE') {
            const exampleRegex = /example/i;
            if (!exampleRegex.test(content)) {
                issues.push('API reference should include usage examples');
            }
        }
    }

    return {
        valid: issues.length === 0,
        issues,
        config
    };
}

/**
 * Generate template metadata
 * @param {string} templateName - Name of the template
 * @returns {Object} Template metadata
 */
function getTemplateMetadata(templateName) {
    const config = getTemplateConfig(templateName);
    if (!config) {
        return null;
    }

    return {
        name: templateName,
        description: config.description,
        category: config.category,
        requiredSections: config.requiredSections.length,
        requiredVariables: config.requiredVariables.length,
        optionalSections: config.optionalSections ? config.optionalSections.length : 0,
        estimatedLength: config.validationRules?.maxLength || 'Variable',
        complexity: calculateTemplateComplexity(config)
    };
}

/**
 * Calculate template complexity score
 * @param {Object} config - Template configuration
 * @returns {string} Complexity level (low, medium, high)
 */
function calculateTemplateComplexity(config) {
    const sectionCount = config.requiredSections.length + (config.optionalSections?.length || 0);
    const variableCount = config.requiredVariables.length;
    const totalComplexity = sectionCount + variableCount;

    if (totalComplexity < 15) return 'low';
    if (totalComplexity < 30) return 'medium';
    return 'high';
}

module.exports = {
    templateConfig,
    getTemplateConfig,
    getAllTemplateConfigs,
    getTemplatesByCategory,
    validateTemplateAgainstConfig,
    getTemplateMetadata,
    calculateTemplateComplexity
};