const { 
  calculateActionDifficulty, 
  calculateExpectedSuccesses,
  adjustDicePools 
} = require('./utils/actionCalculations');

console.log('Testing Dice-Based Action Calculation System\n');

// Test 1: Equal dice pools
console.log('Test 1: Equal dice pools (5 vs 5)');
const test1 = calculateActionDifficulty(5, 5);
console.log(`Success chance: ${(test1 * 100).toFixed(2)}%`);
console.log(`Expected: ~50%\n`);

// Test 2: Knight vs Commoner example from rules
console.log('Test 2: Knight (25) vs Commoner (2)');
const test2 = calculateActionDifficulty(25, 2);
const { adjustedSource, adjustedTarget } = adjustDicePools(25, 2);
console.log(`Original pools: 25 vs 2 (total: 27)`);
console.log(`Adjusted pools: ${adjustedSource} vs ${adjustedTarget}`);
console.log(`Success chance: ${(test2 * 100).toFixed(2)}%`);
console.log(`Expected: Very high (knight should win)\n`);

// Test 3: No opposition
console.log('Test 3: Unopposed action (10 vs 0)');
const test3 = calculateActionDifficulty(10, 0);
console.log(`Success chance: ${(test3 * 100).toFixed(2)}%`);
console.log(`Expected: ~95%\n`);

// Test 4: No source attribute
console.log('Test 4: No source attribute (0 vs 10)');
const test4 = calculateActionDifficulty(0, 10);
console.log(`Success chance: ${(test4 * 100).toFixed(2)}%`);
console.log(`Expected: ~5%\n`);

// Test 5: Small difference
console.log('Test 5: Small difference (6 vs 4)');
const test5 = calculateActionDifficulty(6, 4);
console.log(`Success chance: ${(test5 * 100).toFixed(2)}%`);
console.log(`Expected: Slightly above 50%\n`);

// Test 6: Large pools that don't need halving
console.log('Test 6: Large pools under 20 total (12 vs 7)');
const test6 = calculateActionDifficulty(12, 7);
console.log(`Success chance: ${(test6 * 100).toFixed(2)}%`);
console.log(`Expected: Moderately high\n`);

// Test dice pool adjustment
console.log('Testing dice pool adjustment:');
const poolTests = [
  [10, 10],
  [15, 10],
  [25, 2],
  [50, 50],
  [1, 1]
];

poolTests.forEach(([source, target]) => {
  const { adjustedSource, adjustedTarget } = adjustDicePools(source, target);
  console.log(`${source} vs ${target} => ${adjustedSource} vs ${adjustedTarget} (total: ${adjustedSource + adjustedTarget})`);
});