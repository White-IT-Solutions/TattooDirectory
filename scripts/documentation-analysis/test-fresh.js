// Clear module cache first
delete require.cache[require.resolve('./src/interfaces/IContentConsolidator')];

console.log('Testing fresh load...');
const IContentConsolidator = require('./src/interfaces/IContentConsolidator');
console.log('Type:', typeof IContentConsolidator);
console.log('Is function:', typeof IContentConsolidator === 'function');

if (typeof IContentConsolidator === 'function') {
  try {
    const instance = new IContentConsolidator();
    console.log('Instance created successfully');
  } catch (error) {
    console.log('Error creating instance:', error.message);
  }
} else {
  console.log('Not a constructor function');
}