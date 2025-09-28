const index = require('./index');

console.log('IContentConsolidator:', typeof index.IContentConsolidator);
console.log('IContentConsolidator constructor:', index.IContentConsolidator);

try {
  const instance = new index.IContentConsolidator();
  console.log('Instance created successfully');
} catch (error) {
  console.log('Error creating instance:', error.message);
}

// Check direct import
const IContentConsolidator = require('./src/interfaces/IContentConsolidator');
console.log('Direct import:', typeof IContentConsolidator);

try {
  const directInstance = new IContentConsolidator();
  console.log('Direct instance created successfully');
} catch (error) {
  console.log('Error creating direct instance:', error.message);
}