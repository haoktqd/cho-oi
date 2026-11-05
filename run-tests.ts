import { runAllUnitTests } from './src/tests/economy.test';

console.log('=== CHỢ ƠI! - RUNNING AUTOMATED ECONOMY & SIMULATION TESTS ===');
const results = runAllUnitTests();
console.log(`\nResults: ${results.passed} PASSED, ${results.failed} FAILED`);

if (results.failed > 0) {
  console.error('Failed tests:', results.errors);
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
