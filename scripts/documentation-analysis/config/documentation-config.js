/**
 * Configuration for Documentation Processing Pipeline
 * Defines settings, paths, and rules for documentation analysis and consolidation
 */

const path = require('path');

/**
 * Base configuration for documentation processing
 */
const config = {
  // Project root directory
  projectRoot: path.resolve(__dirname, '../../../'),

  // Documentation directories to analyze
  documentationPaths: [
    'docs',
    'frontend/docs',
    'backend/docs',
    'infrastructure/docs',
    'devtools/docs',
    'scripts/docs',
    '.kiro'
  ],

  // Package.json files to analyze for commands
  packageJsonPaths: [
    'package.json',
    'frontend/package.json',
    'backend/package.json',
    'scripts/package.json'
  ],

  // File patterns to include in analysis
  includePatterns: [
    '**/*.md',
    '**/*.txt',
    '**/README*',
    '**/CHANGELOG*',
    '**/CONTRIBUTING*'
  ],

  // File patterns to exclude from analysis
  excludePatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/**',
    '**/coverage/**',
    '**/dist/**',
    '**/build/**',
    '**/.kiro/consolidated_data_tooling/**',
    '**/.kiro/data-management-state/**',
    '**/.kiro/data_tooling/**'
  ],

  // Target documentation structure
  targetStructure: {
    root: 'docs',
    mainFiles: [
      'README.md',
      'QUICK_START.md',
      'DEVELOPMENT_GUIDE.md',
      'API_REFERENCE.md',
      'TROUBLESHOOTING.md'
    ],
    directories: {
      setup: 'setup',
      components: 'components',
      workflows: 'workflows',
      reference: 'reference',
      architecture: 'architecture'
    }
  },

  // Content categorization rules
  contentCategories: {
    setup: {
      keywords: ['install', 'setup', 'configuration', 'environment', 'dependencies'],
      priority: 'high'
    },
    api: {
      keywords: ['api', 'endpoint', 'handler', 'service', 'lambda'],
      priority: 'high'
    },
    component: {
      keywords: ['component', 'frontend', 'backend', 'infrastructure', 'module'],
      priority: 'medium'
    },
    workflow: {
      keywords: ['workflow', 'process', 'deployment', 'testing', 'monitoring'],
      priority: 'medium'
    },
    reference: {
      keywords: ['command', 'script', 'configuration', 'environment', 'variable'],
      priority: 'low'
    }
  },

  // Command categorization rules
  commandCategories: {
    data: {
      keywords: ['seed', 'data', 'database', 'migration', 'reset'],
      description: 'Data management and seeding commands'
    },
    development: {
      keywords: ['dev', 'start', 'serve', 'watch', 'hot'],
      description: 'Development server and tooling commands'
    },
    testing: {
      keywords: ['test', 'spec', 'coverage', 'e2e', 'integration'],
      description: 'Testing and quality assurance commands'
    },
    deployment: {
      keywords: ['build', 'deploy', 'publish', 'release', 'docker'],
      description: 'Build and deployment commands'
    },
    monitoring: {
      keywords: ['monitor', 'health', 'performance', 'benchmark', 'validate'],
      description: 'Monitoring and performance commands'
    }
  },

  // Validation rules
  validation: {
    // Minimum content length for valid documentation
    minContentLength: 100,
    
    // Required sections for main documentation files
    requiredSections: {
      'README.md': ['Installation', 'Usage', 'Contributing'],
      'DEVELOPMENT_GUIDE.md': ['Setup', 'Development', 'Testing'],
      'API_REFERENCE.md': ['Endpoints', 'Authentication', 'Examples']
    },

    // File extensions to validate for syntax
    codeFileExtensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml'],

    // Commands to skip during validation (known to be interactive or long-running)
    skipCommandValidation: ['dev', 'start', 'serve', 'watch']
  },

  // Gap analysis configuration
  gapAnalysis: {
    // Importance levels for missing documentation
    importanceLevels: {
      critical: {
        score: 4,
        description: 'Essential for project onboarding and development'
      },
      high: {
        score: 3,
        description: 'Important for efficient development workflow'
      },
      medium: {
        score: 2,
        description: 'Helpful for understanding project structure'
      },
      low: {
        score: 1,
        description: 'Nice to have for complete documentation'
      }
    },

    // Effort estimation for documentation tasks
    effortLevels: {
      small: {
        hours: 2,
        description: 'Simple documentation update or creation'
      },
      medium: {
        hours: 8,
        description: 'Comprehensive documentation section'
      },
      large: {
        hours: 16,
        description: 'Major documentation overhaul or new system'
      }
    }
  },

  // Output configuration
  output: {
    // Directory for generated reports
    reportsDir: 'scripts/documentation-analysis/reports',
    
    // Directory for consolidated documentation
    consolidatedDir: 'docs',
    
    // Backup directory for original files
    backupDir: 'scripts/documentation-analysis/backups',
    
    // Report formats
    reportFormats: ['json', 'markdown', 'html']
  },

  // Processing options
  processing: {
    // Whether to create backups before modifying files
    createBackups: true,
    
    // Whether to validate commands by executing them
    validateCommandExecution: false,
    
    // Maximum number of files to process in parallel
    maxConcurrency: 5,
    
    // Timeout for command validation (in milliseconds)
    commandTimeout: 30000
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-separated path to configuration value
 * @returns {*} Configuration value
 */
function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], config);
}

/**
 * Get project root directory
 * @returns {string} Project root path
 */
function getProjectRoot() {
  return config.projectRoot;
}

/**
 * Get documentation paths relative to project root
 * @returns {string[]} Array of documentation paths
 */
function getDocumentationPaths() {
  return config.documentationPaths.map(p => path.join(config.projectRoot, p));
}

/**
 * Get package.json paths relative to project root
 * @returns {string[]} Array of package.json paths
 */
function getPackageJsonPaths() {
  return config.packageJsonPaths.map(p => path.join(config.projectRoot, p));
}

/**
 * Get target documentation structure
 * @returns {Object} Target structure configuration
 */
function getTargetStructure() {
  return config.targetStructure;
}

/**
 * Get content categorization rules
 * @returns {Object} Content category rules
 */
function getContentCategories() {
  return config.contentCategories;
}

/**
 * Get command categorization rules
 * @returns {Object} Command category rules
 */
function getCommandCategories() {
  return config.commandCategories;
}

/**
 * Get validation configuration
 * @returns {Object} Validation rules
 */
function getValidationConfig() {
  return config.validation;
}

/**
 * Get gap analysis configuration
 * @returns {Object} Gap analysis settings
 */
function getGapAnalysisConfig() {
  return config.gapAnalysis;
}

/**
 * Get output configuration
 * @returns {Object} Output settings
 */
function getOutputConfig() {
  return config.output;
}

/**
 * Get processing configuration
 * @returns {Object} Processing options
 */
function getProcessingConfig() {
  return config.processing;
}

module.exports = {
  config,
  getConfig,
  getProjectRoot,
  getDocumentationPaths,
  getPackageJsonPaths,
  getTargetStructure,
  getContentCategories,
  getCommandCategories,
  getValidationConfig,
  getGapAnalysisConfig,
  getOutputConfig,
  getProcessingConfig
};