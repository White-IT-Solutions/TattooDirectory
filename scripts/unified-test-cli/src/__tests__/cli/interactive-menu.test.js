/**
 * Unit tests for InteractiveMenu
 */

import { jest } from '@jest/globals';

// Mock dependencies before importing the module under test
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
  Separator: jest.fn()
}));

jest.mock('../../utils/logger.js', () => ({
  Logger: jest.fn(() => ({
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
  }))
}));

// Import after mocks are set up
import { InteractiveMenu } from '../../cli/interactive-menu.js';
import inquirer from 'inquirer';

// Mock console.log to avoid output during tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('InteractiveMenu', () => {
  let interactiveMenu;
  let mockSuites;

  beforeEach(() => {
    interactiveMenu = new InteractiveMenu();
    jest.clearAllMocks();

    mockSuites = [
      {
        name: 'frontend-unit',
        displayName: 'Frontend Unit Tests',
        description: 'Jest unit tests for React components',
        type: 'unit',
        tags: ['unit', 'frontend', 'fast', 'critical'],
        canRunParallel: true,
        supportsCoverage: true
      },
      {
        name: 'backend-unit',
        displayName: 'Backend Unit Tests',
        description: 'Jest unit tests for Lambda handlers',
        type: 'unit',
        tags: ['unit', 'backend', 'fast', 'critical'],
        canRunParallel: true,
        supportsCoverage: true
      },
      {
        name: 'e2e',
        displayName: 'End-to-End Tests',
        description: 'Playwright E2E tests',
        type: 'e2e',
        tags: ['e2e', 'slow', 'critical'],
        canRunParallel: false,
        supportsCoverage: false,
        dataScenario: 'frontend-ready'
      }
    ];
  });

  describe('showSuiteSelectionMenu', () => {
    it('should show suite selection menu and return selected suites', async () => {
      inquirer.prompt.mockResolvedValue({
        selectedSuites: [mockSuites[0], mockSuites[1]]
      });

      const result = await interactiveMenu.showSuiteSelectionMenu(mockSuites);

      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'checkbox',
          name: 'selectedSuites',
          message: 'Select test suites to run:'
        })
      ]);
      expect(result).toEqual([mockSuites[0], mockSuites[1]]);
    });

    it('should handle "all" selection', async () => {
      inquirer.prompt.mockResolvedValue({
        selectedSuites: ['all']
      });

      const result = await interactiveMenu.showSuiteSelectionMenu(mockSuites);

      expect(result).toEqual(mockSuites);
    });

    it('should handle "critical" selection', async () => {
      inquirer.prompt.mockResolvedValue({
        selectedSuites: ['critical']
      });

      const result = await interactiveMenu.showSuiteSelectionMenu(mockSuites);

      expect(result).toEqual(mockSuites); // All test suites have 'critical' tag
    });

    it('should handle "fast" selection', async () => {
      inquirer.prompt.mockResolvedValue({
        selectedSuites: ['fast']
      });

      const result = await interactiveMenu.showSuiteSelectionMenu(mockSuites);

      expect(result).toEqual([mockSuites[0], mockSuites[1]]); // Only unit tests have 'fast' tag
    });

    it('should throw error for empty suite list', async () => {
      await expect(interactiveMenu.showSuiteSelectionMenu([])).rejects.toThrow('No test suites available');
      await expect(interactiveMenu.showSuiteSelectionMenu(null)).rejects.toThrow('No test suites available');
    });
  });

  describe('showExecutionOptionsMenu', () => {
    it('should show parallel execution options for multiple parallel-capable suites', async () => {
      const selectedSuites = [mockSuites[0], mockSuites[1]]; // Both can run parallel
      inquirer.prompt.mockResolvedValue({
        parallel: true,
        maxParallel: '3',
        coverage: true,
        report: false
      });

      const result = await interactiveMenu.showExecutionOptionsMenu(selectedSuites);

      expect(inquirer.prompt).toHaveBeenCalled();
      expect(result).toEqual({
        parallel: true,
        maxParallel: 3,
        coverage: true,
        report: false
      });
    });

    it('should show coverage option for coverage-capable suites', async () => {
      const selectedSuites = [mockSuites[0]]; // Supports coverage
      inquirer.prompt.mockResolvedValue({
        coverage: true,
        report: false
      });

      const result = await interactiveMenu.showExecutionOptionsMenu(selectedSuites);

      expect(result).toEqual({
        coverage: true,
        report: false
      });
    });

    it('should show scenario selection for suites with different scenarios', async () => {
      const selectedSuites = [mockSuites[0], mockSuites[2]]; // One has dataScenario
      inquirer.prompt.mockResolvedValue({
        scenario: 'frontend-ready',
        coverage: false,
        report: false
      });

      const result = await interactiveMenu.showExecutionOptionsMenu(selectedSuites);

      expect(result).toEqual({
        scenario: 'frontend-ready',
        coverage: false,
        report: false
      });
    });

    it('should return empty object when no options are applicable', async () => {
      const selectedSuites = [
        {
          name: 'simple-test',
          canRunParallel: false,
          supportsCoverage: false,
          dataScenario: null
        }
      ];

      const result = await interactiveMenu.showExecutionOptionsMenu(selectedSuites);

      expect(result).toEqual({});
    });
  });

  describe('showConfirmationMenu', () => {
    it('should show confirmation and return user choice', async () => {
      const selectedSuites = [mockSuites[0]];
      const options = { coverage: true };
      inquirer.prompt.mockResolvedValue({ proceed: true });

      const result = await interactiveMenu.showConfirmationMenu(selectedSuites, options);

      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'confirm',
          name: 'proceed',
          message: '\nProceed with test execution?'
        })
      ]);
      expect(result).toBe(true);
    });

    it('should handle user declining to proceed', async () => {
      const selectedSuites = [mockSuites[0]];
      const options = {};
      inquirer.prompt.mockResolvedValue({ proceed: false });

      const result = await interactiveMenu.showConfirmationMenu(selectedSuites, options);

      expect(result).toBe(false);
    });
  });

  describe('formatSuiteChoice', () => {
    it('should format suite choice with all information', () => {
      const suite = mockSuites[0];
      const result = interactiveMenu.formatSuiteChoice(suite);

      expect(result).toContain('Frontend Unit Tests');
      expect(result).toContain('Jest unit tests for React components');
      expect(result).toContain('[unit, frontend, fast, critical]');
    });

    it('should handle suite without displayName', () => {
      const suite = {
        name: 'test-suite',
        description: 'Test description',
        type: 'unit'
      };

      const result = interactiveMenu.formatSuiteChoice(suite);

      expect(result).toContain('test-suite');
      expect(result).toContain('Test description');
    });

    it('should handle suite without description', () => {
      const suite = {
        name: 'test-suite',
        displayName: 'Test Suite',
        type: 'unit'
      };

      const result = interactiveMenu.formatSuiteChoice(suite);

      expect(result).toContain('Test Suite');
      expect(result).toContain('No description');
    });

    it('should use appropriate icons for different suite types', () => {
      const unitSuite = { ...mockSuites[0], type: 'unit' };
      const e2eSuite = { ...mockSuites[2], type: 'e2e' };
      const integrationSuite = { ...mockSuites[0], type: 'integration' };

      expect(interactiveMenu.formatSuiteChoice(unitSuite)).toContain('⚡');
      expect(interactiveMenu.formatSuiteChoice(e2eSuite)).toContain('🎭');
      expect(interactiveMenu.formatSuiteChoice(integrationSuite)).toContain('🔗');
    });
  });

  describe('processSuiteSelection', () => {
    it('should return all suites for "all" selection', () => {
      const result = interactiveMenu.processSuiteSelection(['all'], mockSuites);
      expect(result).toEqual(mockSuites);
    });

    it('should return critical suites for "critical" selection', () => {
      const result = interactiveMenu.processSuiteSelection(['critical'], mockSuites);
      expect(result).toEqual(mockSuites); // All have critical tag
    });

    it('should return fast suites for "fast" selection', () => {
      const result = interactiveMenu.processSuiteSelection(['fast'], mockSuites);
      expect(result).toEqual([mockSuites[0], mockSuites[1]]);
    });

    it('should return individual suite objects', () => {
      const selected = [mockSuites[0], mockSuites[2]];
      const result = interactiveMenu.processSuiteSelection(selected, mockSuites);
      expect(result).toEqual(selected);
    });
  });

  describe('showErrorMenu', () => {
    it('should show error menu and return retry choice', async () => {
      const error = new Error('Test error');
      inquirer.prompt.mockResolvedValue({ action: 'retry' });

      const result = await interactiveMenu.showErrorMenu(error);

      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'action',
          message: 'What would you like to do?'
        })
      ]);
      expect(result).toBe(true);
    });

    it('should return false for exit choice', async () => {
      const error = new Error('Test error');
      inquirer.prompt.mockResolvedValue({ action: 'exit' });

      const result = await interactiveMenu.showErrorMenu(error);

      expect(result).toBe(false);
    });
  });
});