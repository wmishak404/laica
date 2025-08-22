#!/bin/bash

# Simple test runner script for Laica Cooking Assistant
# Usage: ./run-tests.sh [test-type]

echo "🧪 Laica Cooking Assistant Test Runner"
echo "======================================"

TEST_TYPE=${1:-unit}

case $TEST_TYPE in
  "unit")
    echo "Running fast unit tests..."
    npx vitest run
    ;;
  "unit-watch")
    echo "Running unit tests in watch mode..."
    npx vitest
    ;;
  "unit-coverage")
    echo "Running unit tests with coverage..."
    npx vitest run --coverage
    ;;
  "e2e")
    echo "Running end-to-end tests..."
    npx playwright test
    ;;
  "e2e-ui")
    echo "Running E2E tests with UI..."
    npx playwright test --ui
    ;;
  "e2e-headed")
    echo "Running E2E tests with visible browser..."
    npx playwright test --headed
    ;;
  "all")
    echo "Running all tests..."
    echo "1. Unit tests..."
    npx vitest run
    if [ $? -eq 0 ]; then
      echo "2. E2E tests..."
      npx playwright test
    else
      echo "❌ Unit tests failed, skipping E2E tests"
      exit 1
    fi
    ;;
  *)
    echo "Available test types:"
    echo "  unit          - Fast unit tests (default)"
    echo "  unit-watch    - Unit tests in watch mode"
    echo "  unit-coverage - Unit tests with coverage"
    echo "  e2e           - End-to-end browser tests"
    echo "  e2e-ui        - E2E tests with UI interface"
    echo "  e2e-headed    - E2E tests with visible browser"
    echo "  all           - Run all tests"
    echo ""
    echo "Usage: ./run-tests.sh [test-type]"
    exit 1
    ;;
esac

echo "✅ Test execution completed!"