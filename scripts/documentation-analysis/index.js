/**
 * Documentation Analysis Infrastructure
 * Main entry point for documentation processing tools
 */

const DocumentationAnalyzer = require('./src/DocumentationAnalyzer');
const ContentConsolidator = require('./src/ContentConsolidator');
const CommandDocumentationGenerator = require('./src/CommandDocumentationGenerator');
const DocumentationValidator = require('./src/DocumentationValidator');
const GapAnalysisReporter = require('./src/GapAnalysisReporter');

module.exports = {
  DocumentationAnalyzer,
  ContentConsolidator,
  CommandDocumentationGenerator,
  DocumentationValidator,
  GapAnalysisReporter
};