/**
 * Type definitions for documentation analysis components
 * These interfaces define the structure of data used throughout the documentation processing pipeline
 */

/**
 * @typedef {Object} FileInfo
 * @property {string} path - File path relative to project root
 * @property {'active'|'moved'|'outdated'|'duplicate'} status - Current status of the file
 * @property {Date} lastModified - Last modification date
 * @property {'setup'|'api'|'component'|'workflow'|'reference'} contentType - Type of content
 * @property {string[]} dependencies - Array of file paths this file depends on
 */

/**
 * @typedef {Object} MovedFileInfo
 * @property {string} originalPath - Original file path
 * @property {string} newPath - New file path (if known)
 * @property {boolean} contentMigrated - Whether content has been migrated
 * @property {string} reason - Reason for the move
 */

/**
 * @typedef {Object} DuplicateInfo
 * @property {string[]} filePaths - Array of file paths with duplicate content
 * @property {number} similarityScore - Similarity score (0-1)
 * @property {string} recommendedAction - Recommended consolidation action
 */

/**
 * @typedef {Object} ContentInfo
 * @property {string} filePath - Path to the content file
 * @property {string} title - Content title
 * @property {string} summary - Brief content summary
 * @property {string[]} sections - Array of section headings
 * @property {string[]} references - Array of referenced files/links
 */

/**
 * @typedef {Object} DocumentationMap
 * @property {FileInfo[]} currentFiles - All current documentation files
 * @property {MovedFileInfo[]} movedFiles - Files marked as moved
 * @property {string[]} missingFiles - Referenced but missing files
 * @property {DuplicateInfo[]} duplicateContent - Duplicate content information
 * @property {ContentInfo[]} validContent - Valid content for consolidation
 */

/**
 * @typedef {Object} ContentBlock
 * @property {'text'|'code'|'command'|'diagram'|'table'} type - Type of content block
 * @property {string} content - The actual content
 * @property {Object} metadata - Content metadata
 * @property {string} metadata.source - Source file path
 * @property {boolean} metadata.validated - Whether content has been validated
 * @property {Date} metadata.lastUpdated - Last update timestamp
 */

/**
 * @typedef {Object} DocumentationSection
 * @property {string} id - Unique section identifier
 * @property {string} title - Section title
 * @property {'setup'|'development'|'deployment'|'reference'} category - Section category
 * @property {'high'|'medium'|'low'} priority - Section priority
 * @property {string[]} sourceFiles - Source files for this section
 * @property {string} targetFile - Target consolidated file
 * @property {ContentBlock[]} content - Content blocks in this section
 */

/**
 * @typedef {Object} Parameter
 * @property {string} name - Parameter name
 * @property {string} type - Parameter type
 * @property {boolean} required - Whether parameter is required
 * @property {string} description - Parameter description
 * @property {string} [defaultValue] - Default value if any
 */

/**
 * @typedef {Object} UsageExample
 * @property {string} scenario - Usage scenario description
 * @property {string} command - Command to execute
 * @property {string} expectedOutput - Expected command output
 * @property {string[]} notes - Additional notes
 */

/**
 * @typedef {Object} Command
 * @property {string} name - Command name
 * @property {string} script - Command script
 * @property {string} description - Command description
 * @property {'data'|'development'|'testing'|'deployment'|'monitoring'} category - Command category
 * @property {Parameter[]} parameters - Command parameters
 * @property {UsageExample[]} examples - Usage examples
 * @property {string[]} relatedCommands - Related command names
 */

/**
 * @typedef {Object} MissingDocInfo
 * @property {string} feature - Feature name
 * @property {string} component - Component name
 * @property {'critical'|'high'|'medium'|'low'} importance - Importance level
 * @property {'small'|'medium'|'large'} estimatedEffort - Estimated effort
 * @property {string[]} dependencies - Dependencies for this documentation
 */

/**
 * @typedef {Object} OutdatedContentInfo
 * @property {string} filePath - Path to outdated file
 * @property {Date} lastUpdated - Last update date
 * @property {string[]} issues - List of identified issues
 * @property {string} recommendedAction - Recommended action
 */

/**
 * @typedef {Object} InconsistencyInfo
 * @property {string} type - Type of inconsistency
 * @property {string[]} affectedFiles - Files affected by inconsistency
 * @property {string} description - Description of the inconsistency
 * @property {string} suggestedFix - Suggested fix
 */

/**
 * @typedef {Object} RecommendationInfo
 * @property {string} category - Recommendation category
 * @property {string} title - Recommendation title
 * @property {string} description - Detailed description
 * @property {'high'|'medium'|'low'} priority - Priority level
 * @property {string[]} actionItems - Specific action items
 */

/**
 * @typedef {Object} PriorityMatrix
 * @property {Object} high - High priority items
 * @property {Object} medium - Medium priority items
 * @property {Object} low - Low priority items
 */

/**
 * @typedef {Object} GapAnalysisReport
 * @property {MissingDocInfo[]} missingDocumentation - Missing documentation items
 * @property {OutdatedContentInfo[]} outdatedContent - Outdated content items
 * @property {InconsistencyInfo[]} inconsistencies - Inconsistencies found
 * @property {RecommendationInfo[]} recommendations - Recommendations for improvement
 * @property {PriorityMatrix} priorityMatrix - Priority matrix for improvements
 */

/**
 * @typedef {Object} PathValidationResult
 * @property {boolean} isValid - Whether all paths are valid
 * @property {string[]} invalidPaths - List of invalid paths
 * @property {string[]} suggestions - Suggested corrections
 */

/**
 * @typedef {Object} CommandValidationResult
 * @property {boolean} isValid - Whether all commands are valid
 * @property {Object[]} failedCommands - Commands that failed validation
 * @property {string[]} suggestions - Suggested fixes
 */

/**
 * @typedef {Object} ContentValidationResult
 * @property {boolean} isValid - Whether content is valid
 * @property {string[]} issues - List of content issues
 * @property {string[]} warnings - List of warnings
 */

/**
 * @typedef {Object} CrossReferenceValidationResult
 * @property {boolean} isValid - Whether cross-references are valid
 * @property {string[]} brokenReferences - List of broken references
 * @property {string[]} suggestions - Suggested fixes
 */

/**
 * @typedef {Object} ValidationReport
 * @property {PathValidationResult} pathValidation - Path validation results
 * @property {CommandValidationResult} commandValidation - Command validation results
 * @property {ContentValidationResult} contentValidation - Content validation results
 * @property {CrossReferenceValidationResult} crossReferenceValidation - Cross-reference validation results
 * @property {number} overallScore - Overall validation score (0-100)
 */

module.exports = {
  // Export type definitions for JSDoc usage
  // These are used for documentation and IDE support
};