# SpotKin Text-to-Speech API Documentation

## Overview

SpotKin's Text-to-Speech (TTS) system provides intelligent voice alerts for high-severity monitoring events. The system uses a multi-layered approach with intelligent fallbacks to ensure reliable voice notifications across all browsers and platforms.

## Architecture

### Multi-Layered TTS System

The TTS system implements three layers of fallback for maximum reliability:

1. **Primary**: Puter.js Neural TTS (highest quality)
2. **Fallback 1**: Pollinations.ai OpenAI-compatible TTS
3. **Fallback 2**: Web Speech API (browser native)

```javascript
// TTS Flow
Puter.js Neural TTS → Pollinations.ai TTS → Web Speech API
```

## Core Functions

### `speakAlert(alertData, severity)`

Main function that triggers text-to-speech for high-severity alerts.

**Parameters:**
- `alertData` (Object): Alert information containing alert type and context
- `severity` (Object): Severity information with level property

**Behavior:**
- Only triggers for severity ≥7 on 1-10 scale
- Automatically selects appropriate TTS method with fallbacks
- Logs TTS attempts and successes to console

**Example:**
```javascript
const alertData = { alert: { type: 'safety' } };
const severity = { level: 'high' };
speakAlert(alertData, severity);
```

### `generateAlertMessage(alertData, severity)`

Generates contextual alert messages based on alert type and severity.

**Parameters:**
- `alertData` (Object): Alert information
- `severity` (Object): Severity level information

**Returns:**
- `String`: Formatted alert message for TTS

**Message Templates:**
```javascript
const messages = {
    'safety': `${severityText} safety alert! Please check immediately.`,
    'movement': `${severityText} movement detected. Unusual activity observed.`,
    'unusual': `${severityText} unusual behavior detected. Please review.`,
    'danger': `${severityText} danger alert! Immediate attention required.`,
    'activity': `${severityText} activity alert. Something is happening.`,
    'default': `${severityText} alert detected. Please check the monitoring area.`
};
```

### `toggleVoiceAlerts()`

Toggles voice alerts on/off and updates UI state.

**Behavior:**
- Toggles `userPreferences.voiceAlerts` boolean
- Updates button visual state (color, icon, tooltip)
- Saves preference to localStorage
- Plays test TTS when enabled

### `updateVoiceAlertsButton()`

Updates the voice alerts toggle button appearance based on current state.

**Visual States:**
- **ON**: Green background, volume-up icon, "Voice Alerts: ON" tooltip
- **OFF**: Gray background, volume-mute icon, "Voice Alerts: OFF" tooltip

## TTS Implementation Details

### 1. Puter.js Neural TTS (Primary)

```javascript
const audio = await puter.ai.txt2speech(message, {
    voice: userPreferences.voiceType || 'Joanna',
    engine: 'neural'
});
audio.play();
```

**Features:**
- Neural engine for natural speech
- Multiple voice options (Joanna, Matthew, Amy, Emma)
- High quality output
- Integrated with existing Puter.js infrastructure

### 2. Pollinations.ai TTS (Fallback 1)

```javascript
const voice = voiceMap[userPreferences.voiceType] || 'nova';
const audioUrl = `https://text.pollinations.ai/${encodeURIComponent(message)}?model=openai-audio&voice=${voice}`;
const audio = new Audio(audioUrl);
audio.play();
```

**Voice Mapping:**
```javascript
const voiceMap = {
    'Joanna': 'nova',
    'Matthew': 'onyx', 
    'Amy': 'alloy',
    'Emma': 'shimmer'
};
```

### 3. Web Speech API (Fallback 2)

```javascript
const utterance = new SpeechSynthesisUtterance(message);
utterance.rate = 1.1;
utterance.pitch = 1.0;
utterance.volume = 0.8;
speechSynthesis.speak(utterance);
```

**Configuration:**
- Speech rate: 1.1 (slightly faster than normal)
- Pitch: 1.0 (normal pitch)
- Volume: 0.8 (80% volume)

## Severity Threshold System

### `getSeverityNumber(severityLevel)`

Converts severity levels to numeric values for threshold checking.

**Mapping:**
```javascript
const severityMap = {
    'minimal': 2,
    'low': 4,
    'medium': 6,
    'high': 8,
    'critical': 10
};
```

**TTS Trigger Rule:**
- Voice alerts only trigger for severity ≥7
- This includes 'high' (8) and 'critical' (10) alerts
- Prevents voice alert fatigue from minor events

## User Interface Integration

### Toggle Button Location
- **Container**: `#camera-controls` (bottom-right of camera view)
- **Element ID**: `#voice-alerts-toggle`
- **Position**: Above snapshot button in vertical stack

### Button States
```css
/* Enabled State */
.bg-green-600.hover:bg-green-700

/* Disabled State */
.bg-gray-600.hover:bg-gray-700
```

### Event Handling
```javascript
voiceAlertsToggle.addEventListener('click', toggleVoiceAlerts);
```

## Preference Management

### Default Preferences
```javascript
const defaultPreferences = {
    // ...
    voiceAlerts: false,
    voiceType: 'Joanna',
    // ...
};
```

### Preference Persistence
- Stored in secure localStorage with encryption
- Automatically loaded on app initialization
- Applied to UI via `applyPreferencesToUI()`

## Integration with Alert System

### Alert Flow Integration
```javascript
if (shouldAlert && window.playAlertSound) {
    const severity = classifyAlertSeverity(aiResult.alert, aiResult);
    window.playAlertSound(severity.level);
    
    // TTS integration point
    speakAlert(aiResult, severity);
}
```

### Alert Severity Classification
The TTS system integrates with SpotKin's existing 10-point severity classification:
- Uses `classifyAlertSeverity()` function
- Respects user alert preferences (`alertMovement`, `alertSafety`, etc.)
- Only triggers for alerts that pass user filtering

## Testing

### Global Function Exposure
```javascript
// Exposed for testing
window.speakAlert = speakAlert;
window.toggleVoiceAlerts = toggleVoiceAlerts;
window.generateAlertMessage = generateAlertMessage;
```

### Test Coverage
- Toggle button functionality
- Preference persistence
- Message generation for all alert types
- Severity threshold enforcement
- Fallback system reliability
- Accessibility compliance

### Test File
- **Location**: `cypress/e2e/text-to-speech.cy.js`
- **Coverage**: 12+ comprehensive test cases
- **Integration**: Tests with existing alert severity system

## Browser Compatibility

### Supported Browsers
- **Chrome/Edge**: All TTS methods supported
- **Firefox**: Puter.js and Web Speech API supported
- **Safari**: Web Speech API as reliable fallback
- **Mobile**: Progressive enhancement with fallbacks

### Autoplay Policies
- Respects browser autoplay restrictions
- TTS only triggers after user interaction (monitoring start)
- Graceful handling of blocked audio playback

## Error Handling

### Fallback Chain
```javascript
try {
    // Puter.js TTS
} catch (error) {
    try {
        // Pollinations.ai TTS  
    } catch (fallbackError) {
        // Web Speech API TTS
    }
}
```

### Logging
- Console logs for each TTS method attempt
- Success/failure tracking for debugging
- Error details captured for troubleshooting

## Performance Considerations

### Efficient Message Generation
- Pre-defined message templates
- Minimal processing overhead
- No redundant TTS calls

### Network Optimization
- Puter.js uses existing connection
- Pollinations.ai URL encoding optimization
- Web Speech API is local (no network)

## Privacy & Security

### Data Handling
- No personal data in TTS messages
- Alert messages are generic and contextual
- No storage of voice data or audio files

### Local Processing
- Web Speech API is completely local
- External TTS services receive only alert text
- No user identification in TTS requests

## Configuration Options

### Voice Selection
```javascript
// Available voice types
const voiceTypes = ['Joanna', 'Matthew', 'Amy', 'Emma'];
```

### Customizable Settings
- Voice type selection (future enhancement)
- Volume control (future enhancement)
- Speech rate adjustment (future enhancement)

## Future Enhancements

### Planned Features
- Voice type selection in preferences UI
- Volume control slider
- Custom alert message templates
- Multi-language TTS support
- Voice recognition for interaction

### Integration Opportunities
- Smart home device integration
- Cross-device notification relay
- Voice command recognition
- Alert acknowledgment via voice

---

*This documentation covers SpotKin TTS API Version 1.0 - implemented in SpotKin v4.1*