// Quick test to verify our setup
console.log('Testing basic Jest setup...');

const { toInt, toFloat } = require('./utils/stringToNumber');

console.log('toInt(5):', toInt(5));
console.log('toFloat(5.5):', toFloat(5.5));

console.log('Basic test completed successfully');