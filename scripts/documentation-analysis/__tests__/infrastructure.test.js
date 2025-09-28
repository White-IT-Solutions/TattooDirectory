/**
 * Basic infrastructure tests to verify the documentation analysis system is set up correctly
 */

const {
  DocumentationAnalyzer,
  ContentConsolidator,
  CommandDocumentationGenerator,
  DocumentationValidator,
  GapAnalysisReporter
} = require('../index');

const { getConfig } = require('../config/documentation-config');

describe('Documentation Analysis Infrastructure', () => {
  test('should export all main components', () => {
    expect(DocumentationAnalyzer).toBeDefined();
    expect(ContentConsolidator).toBeDefined();
    expect(CommandDocumentationGenerator).toBeDefined();
    expect(DocumentationValidator).toBeDefined();
    expect(GapAnalysisReporter).toBeDefined();
  });

  test('should be able to instantiate main components', () => {
    expect(() => new DocumentationAnalyzer()).not.toThrow();
    expect(() => new ContentConsolidator()).not.toThrow();
    expect(() => new CommandDocumentationGenerator()).not.toThrow();
    expect(() => new DocumentationValidator()).not.toThrow();
    expect(() => new GapAnalysisReporter()).not.toThrow();
  });

  test('should have configuration available', () => {
    expect(getConfig).toBeDefined();
    expect(typeof getConfig).toBe('function');
    
    const config = getConfig('projectRoot');
    expect(config).toBeDefined();
  });

  test('components should have expected interface methods', () => {
    const analyzer = new DocumentationAnalyzer();
    const consolidator = new ContentConsolidator();
    const generator = new CommandDocumentationGenerator();
    const validator = new DocumentationValidator();
    const reporter = new GapAnalysisReporter();

    // Check that interface methods exist (even if they throw "not implemented" errors)
    expect(typeof analyzer.analyzeStructure).toBe('function');
    expect(typeof consolidator.consolidateSection).toBe('function');
    expect(typeof generator.generateCommandReference).toBe('function');
    expect(typeof validator.validateDocumentationSet).toBe('function');
    expect(typeof reporter.generateGapReport).toBe('function');
  });

  test('unimplemented interface methods should throw "not implemented" errors', async () => {
    const analyzer = new DocumentationAnalyzer();
    const generator = new CommandDocumentationGenerator();
    const validator = new DocumentationValidator();
    const reporter = new GapAnalysisReporter();
    
    // Test unimplemented components (use methods that actually throw errors)
    await expect(analyzer.validateReferences()).rejects.toThrow('implementation pending');
    await expect(analyzer.generateGapReport()).rejects.toThrow('implementation pending');
    await expect(generator.generateCommandReference()).rejects.toThrow('implementation pending');
    await expect(validator.validateDocumentationSet({})).rejects.toThrow('implementation pending');
    await expect(reporter.generateGapReport()).rejects.toThrow('implementation pending');
  });

  test('ContentConsolidator should be fully implemented', async () => {
    const consolidator = new ContentConsolidator();
    
    // Test that ContentConsolidator methods are implemented and don't throw "not implemented" errors
    const testSection = {
      id: 'test',
      title: 'Test',
      content: [{ type: 'text', content: 'test content', metadata: {} }]
    };
    
    // These should not throw "implementation pending" errors
    await expect(consolidator.consolidateSection(testSection)).resolves.toBeDefined();
    await expect(consolidator.standardizeFormatting('test')).resolves.toBeDefined();
    await expect(consolidator.updateReferences('test', {})).resolves.toBeDefined();
    await expect(consolidator.generateTableOfContents([])).resolves.toBeDefined();
  });
});