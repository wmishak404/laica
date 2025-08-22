# Test Criteria Definition

## How to Define and Run Tests

### 1. Define Your Test Criteria

You can specify what needs to be tested by editing the test files or creating new ones:

**Unit Tests** (`tests/unit/`):
- Test individual functions and components
- Fast execution (< 1 second each)
- Good for logic validation

**E2E Tests** (`tests/e2e/`):
- Test complete user workflows
- Browser automation
- Good for user experience validation

### 2. Test Categories

#### Voice Interface Tests
```javascript
// Define criteria like:
- Voice recording starts/stops correctly
- Silence detection allows natural speech (4+ seconds)
- Operational messages don't trigger TTS
- Audio controls work properly
```

#### Cooking Workflow Tests  
```javascript
// Define criteria like:
- Recipe selection works
- Step progression functions
- Timer functionality
- Ingredient tracking
```

#### Authentication Tests
```javascript
// Define criteria like:
- Google sign-in flow
- Session persistence
- User data isolation
- Logout functionality
```

### 3. Running Tests

Use the test runner script:

```bash
# Run fast unit tests
node test-runner.js unit

# Run with coverage report  
node test-runner.js unit:coverage

# Run end-to-end tests
node test-runner.js e2e

# Run all tests
node test-runner.js all
```

### 4. Test Criteria Examples

#### Example 1: Voice Recording Patience
```javascript
test('Voice recording allows natural conversation pauses', async () => {
  // Criteria: Should not cut off mid-sentence
  // Should wait 4 seconds of silence
  // Should allow 3 seconds before silence detection starts
});
```

#### Example 2: Operational Message Silence
```javascript
test('System messages stay silent', async () => {
  // Criteria: "Processing your question..." should not play audio
  // Conversational responses should play audio
  // Error messages should not play audio
});
```

#### Example 3: Recipe Selection Flow
```javascript
test('Complete recipe selection workflow', async () => {
  // Criteria: User can browse recipes
  // Can select a recipe
  // Can start cooking session
  // Can navigate through steps
});
```

### 5. Adding New Test Criteria

1. **Identify the requirement**: What functionality needs validation?
2. **Choose test type**: Unit (fast, isolated) or E2E (complete workflow)
3. **Write the test**: Define the specific criteria and validation steps
4. **Run and validate**: Ensure the test catches real issues

### 6. Test Results Interpretation

- **Green (✅)**: Criteria met, functionality works as expected
- **Red (❌)**: Criteria failed, needs investigation
- **Yellow (⚠️)**: Warning, might need attention

### 7. Continuous Testing

Before making changes:
```bash
node test-runner.js unit  # Quick validation
```

After making changes:
```bash
node test-runner.js all   # Full validation
```

This ensures no regressions are introduced as the codebase grows in complexity.