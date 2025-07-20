#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs comprehensive tests for the Debate Coach AI API
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Starting Debate Coach AI Test Suite\n');

// Test configurations
const testConfigs = [
  {
    name: 'Unit Tests',
    command: 'npm',
    args: ['run', 'test', '--', '--testPathPattern=unit', '--verbose'],
    description: 'Testing individual service functions and utilities'
  },
  {
    name: 'Integration Tests', 
    command: 'npm',
    args: ['run', 'test', '--', '--testPathPattern=integration', '--verbose'],
    description: 'Testing API endpoints and database interactions'
  },
  {
    name: 'Coverage Report',
    command: 'npm',
    args: ['run', 'test:coverage'],
    description: 'Generating test coverage report'
  }
];

async function runTest(config) {
  console.log(`\n📋 ${config.name}`);
  console.log(`   ${config.description}\n`);

  return new Promise((resolve, reject) => {
    const child = spawn(config.command, config.args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${config.name} completed successfully`);
        resolve(code);
      } else {
        console.log(`\n❌ ${config.name} failed with code ${code}`);
        reject(code);
      }
    });

    child.on('error', (err) => {
      console.error(`\n💥 ${config.name} error:`, err.message);
      reject(err);
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();
  let passedTests = 0;
  
  for (const config of testConfigs) {
    try {
      await runTest(config);
      passedTests++;
    } catch (error) {
      console.error(`\nTest suite "${config.name}" failed. Continuing with remaining tests...`);
    }
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 TEST SUITE SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${testConfigs.length} test suites`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  
  if (passedTests === testConfigs.length) {
    console.log('🎉 All tests passed! Your API is ready for deployment.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test suite interrupted by user');
  process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
