#!/usr/bin/env node

/**
 * Test Runner for Laica Cooking Assistant
 * 
 * This script provides a simple interface to run tests based on your criteria
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const COMMANDS = {
  unit: ['npx', ['vitest']],
  'unit:ui': ['npx', ['vitest', '--ui']],
  'unit:coverage': ['npx', ['vitest', '--coverage']],
  e2e: ['npx', ['playwright', 'test']],
  'e2e:ui': ['npx', ['playwright', 'test', '--ui']],
  'e2e:headed': ['npx', ['playwright', 'test', '--headed']],
  all: [
    ['npx', ['vitest']],
    ['npx', ['playwright', 'test']]
  ]
};

function runCommand([cmd, args]) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running: ${cmd} ${args.join(' ')}\n`);
    
    const proc = spawn(cmd, args, { 
      stdio: 'inherit',
      shell: false 
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'unit';
  
  if (!COMMANDS[testType]) {
    console.log(`
🧪 Laica Cooking Assistant Test Runner

Available test types:
  unit          - Fast unit tests (default)
  unit:ui       - Unit tests with UI interface
  unit:coverage - Unit tests with coverage report
  e2e           - End-to-end browser tests
  e2e:ui        - E2E tests with UI interface
  e2e:headed    - E2E tests with visible browser
  all           - Run all tests

Usage: node test-runner.js [test-type]
Example: node test-runner.js e2e
    `);
    process.exit(1);
  }
  
  try {
    const commands = COMMANDS[testType];
    if (testType === 'all') {
      for (const command of commands) {
        await runCommand(command);
      }
    } else {
      await runCommand(commands);
    }
    console.log(`\n✅ Tests completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌ Tests failed: ${error.message}\n`);
    process.exit(1);
  }
}

main().catch(console.error);