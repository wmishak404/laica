/**
 * Test Criteria Definition Template
 * 
 * Use this file to define new test criteria that I can implement and run
 */

export const testCriteria = {
  // Voice Interface Tests
  voiceRecording: {
    name: "Voice Recording Functionality",
    criteria: [
      "Recording starts when 'Ask for Help' is clicked",
      "Shows 'Listening...' indicator during recording",
      "Allows 3+ seconds before silence detection starts",
      "Requires 4+ seconds of silence to auto-stop",
      "Manual cancel works immediately",
      "Processes transcription after recording stops"
    ],
    priority: "high"
  },

  audioSystem: {
    name: "Audio and TTS System",
    criteria: [
      "Operational messages ('Processing your question...') are silent",
      "Conversational responses play via TTS",
      "Audio mute/unmute toggle works",
      "ElevenLabs API calls work with fallback to browser TTS",
      "No double audio playback during cooking prep",
      "Voice settings persist between sessions"
    ],
    priority: "high"
  },

  // User Experience Tests
  cookingWorkflow: {
    name: "Complete Cooking Experience",
    criteria: [
      "User can sign in with Google",
      "Recipe selection loads and displays properly",
      "Cooking steps progress in correct order",
      "Timer functionality works accurately",
      "Step navigation (next/previous) functions",
      "Recipe completion updates user's pantry"
    ],
    priority: "medium"
  },

  // Performance Tests
  performance: {
    name: "System Performance",
    criteria: [
      "Page loads within 3 seconds",
      "Voice recording starts within 500ms",
      "TTS playback begins within 1 second",
      "Recipe loading completes within 10 seconds",
      "Memory usage stays under 100MB",
      "No memory leaks during extended use"
    ],
    priority: "medium"
  },

  // Error Handling Tests
  errorHandling: {
    name: "Error Handling and Edge Cases",
    criteria: [
      "Graceful microphone permission denial",
      "Network failure recovery",
      "Invalid recipe data handling",
      "API rate limit handling",
      "Browser compatibility (Chrome, Firefox, Safari)",
      "Mobile device responsiveness"
    ],
    priority: "low"
  }
};

/**
 * How to use this template:
 * 
 * 1. Define your criteria above
 * 2. Run: node create-test.js [test-name] [criteria-key]
 * 3. I'll generate the appropriate test files
 * 4. Run: ./run-tests.sh [test-type] to execute
 * 
 * Example:
 * node create-test.js voice-patience voiceRecording
 * ./run-tests.sh unit
 */