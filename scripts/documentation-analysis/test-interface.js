// Test individual interface loading
console.log('Testing IContentConsolidator...');

const IContentConsolidator = require('./src/interfaces/IContentConsolidator');
console.log('Type:', typeof IContentConsolidator);
console.log('Constructor:', IContentConsolidator.constructor);
console.log('Prototype:', IContentConsolidator.prototype);

// Check if it's a function/class
console.log('Is function:', typeof IContentConsolidator === 'function');

// Try to create instance
try {
  const instance = new IContentConsolidator();
  console.log('Instance created:', instance);
} catch (error) {
  console.log('Error:', error.message);
}

// Check the actual file content
const fs = require('fs');
const content = fs.readFileSync('./src/interfaces/IContentConsolidator.js', 'utf8');
console.log('File ends with:', content.slice(-100));