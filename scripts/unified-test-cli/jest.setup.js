/**
 * Jest Setup - Global mocks and configuration
 * 
 * This file is loaded before all tests to set up global mocks
 * and resolve ES module compatibility issues.
 */

// Mock chalk to avoid ES module issues in Jest
jest.mock('chalk', () => ({
  red: jest.fn((text) => `[RED]${text}[/RED]`),
  green: jest.fn((text) => `[GREEN]${text}[/GREEN]`),
  blue: jest.fn((text) => `[BLUE]${text}[/BLUE]`),
  yellow: jest.fn((text) => `[YELLOW]${text}[/YELLOW]`),
  gray: jest.fn((text) => `[GRAY]${text}[/GRAY]`),
  dim: jest.fn((text) => `[DIM]${text}[/DIM]`),
  bold: jest.fn((text) => `[BOLD]${text}[/BOLD]`),
  cyan: jest.fn((text) => `[CYAN]${text}[/CYAN]`),
  magenta: jest.fn((text) => `[MAGENTA]${text}[/MAGENTA]`),
  white: jest.fn((text) => `[WHITE]${text}[/WHITE]`),
  black: jest.fn((text) => `[BLACK]${text}[/BLACK]`),
  default: jest.fn((text) => text)
}));

// Mock ora (spinner) to avoid ES module issues
jest.mock('ora', () => {
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    text: '',
    color: 'cyan',
    isSpinning: false
  };
  
  return jest.fn(() => mockSpinner);
});

// Mock inquirer to avoid ES module issues
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
  createPromptModule: jest.fn(() => ({
    prompt: jest.fn()
  }))
}));