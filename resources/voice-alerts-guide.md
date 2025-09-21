# SpotKin Voice Alerts Setup Guide

Voice alerts are SpotKin's signature feature - spoken notifications that tell you exactly what's happening when you can't watch the screen. This guide will help you set up and optimize voice alerts for the best monitoring experience.

## 🔊 Quick Setup (30 seconds)

1. **Open SpotKin** in your browser
2. **Allow microphone access** when prompted (required for voice alerts)
3. **Test your volume** - voice alerts will play at your current system volume
4. **Start monitoring** - voice alerts automatically activate when motion is detected

That's it! Voice alerts work immediately with no additional setup required.

## 🎯 Why Voice Alerts Matter

Traditional monitoring requires you to constantly watch a screen. SpotKin's voice alerts let you:
- **Multitask freely** - cook, clean, work while staying informed
- **Respond instantly** - know immediately when attention is needed
- **Stay relaxed** - no screen-watching anxiety, just clear spoken updates

## 🛠️ Detailed Setup Instructions

### Step 1: Browser Permissions

When you first open SpotKin, your browser will ask for microphone permission:

**Chrome/Edge:**
- Click "Allow" in the permission popup
- If you accidentally clicked "Block", click the 🔒 lock icon in address bar → Site settings → Microphone → Allow

**Firefox:**
- Click "Allow" in the permission bar
- If blocked: Click shield icon in address bar → Permissions → Microphone → Allow

**Safari:**
- Click "Allow" when prompted
- If blocked: Safari menu → Settings → Websites → Microphone → Allow for SpotKin

> **Why microphone access?** SpotKin uses your device's speech synthesis (text-to-speech) which requires microphone permission in most browsers for security reasons. No audio is recorded or transmitted.

### Step 2: Volume & Audio Settings

**System Volume:**
- Set your device volume to 50-70% for clear voice alerts
- Voice alerts respect your system volume level
- Test with a voice alert to find your preferred level

**Headphones vs Speakers:**
- **Speakers recommended** - you'll hear alerts from anywhere in the room
- **Headphones work** but you need to keep them on
- **Bluetooth speakers** - perfect for whole-room coverage

**Audio Output Device:**
- Voice alerts use your default audio device
- Change in system settings if you want alerts on specific speakers
- Test voice alerts after changing audio devices

### Step 3: Voice Settings Customization

SpotKin offers several voice customization options:

**Voice Speed:**
- Default: Normal speed for clear understanding
- Fast: Quick alerts for experienced users
- Slow: Clearer pronunciation for noisy environments

**Voice Type:**
- Uses your system's default voice
- Windows: Change in Settings → Time & Language → Speech
- Mac: Change in System Preferences → Accessibility → Speech
- Mobile: Usually follows system language settings

**Alert Frequency:**
- Immediate: Alert on every detection (default)
- Throttled: Maximum one alert per 30 seconds
- Critical only: Only major movement changes

### Step 4: Testing Your Setup

**Quick Test:**
1. Start monitoring mode
2. Wave your hand in front of the camera
3. Listen for "Motion detected in monitoring zone"
4. Adjust volume if needed

**Full Test Scenario:**
1. Set up monitoring for a pet or room
2. Leave and return to trigger alerts
3. Verify you can hear alerts from intended distance
4. Test in your actual use environment (kitchen, office, etc.)

## 🔧 Troubleshooting Common Issues

### No Voice Alerts Playing

**Check Microphone Permission:**
- Look for microphone icon in browser address bar
- Ensure it shows "allowed" not "blocked"
- Refresh page after changing permissions

**Check System Audio:**
- Verify system volume is not muted
- Test other audio (YouTube, music) to confirm speakers work
- Try different audio output device

**Browser-Specific Issues:**
- **Chrome:** Clear site data and re-grant permissions
- **Firefox:** Check about:preferences#privacy for blocked sites
- **Safari:** Check if "Prevent cross-site tracking" is interfering

### Voice Alerts Too Quiet/Loud

**Volume Solutions:**
- Adjust system volume (affects all SpotKin audio)
- Move closer to speakers if using built-in laptop speakers
- Use external speakers for better room coverage
- Check if audio is routing to wrong device (headphones vs speakers)

### Voice Alerts Cut Off or Unclear

**Speech Synthesis Issues:**
- Some browsers load voice engines slowly on first use
- Wait 10-15 seconds after opening SpotKin before testing
- Try refreshing the page if voice sounds robotic
- Switch to different voice in system settings

### Alerts in Wrong Language

**Language Settings:**
- Voice alerts use your browser's language setting
- Change browser language: Settings → Languages
- System voice language: varies by operating system
- Refresh SpotKin after changing language settings

## 📱 Mobile Device Setup

### iPhone/iPad Setup

1. **Safari Settings:**
   - Settings → Safari → Camera & Microphone Access → Allow
   - Ensure "Request Desktop Website" is OFF for SpotKin

2. **Volume Considerations:**
   - Use physical volume buttons to adjust
   - Check Ring/Silent switch position
   - Voice alerts respect "Do Not Disturb" settings

3. **Background Usage:**
   - Keep Safari tab active for continuous alerts
   - Add SpotKin to home screen for app-like experience

### Android Setup

1. **Chrome Permissions:**
   - Site settings → Microphone → Allow
   - Notifications → Allow (for voice alert prompts)

2. **Volume Setup:**
   - Use volume rocker for media volume
   - Voice alerts use "Media" volume, not "Ring" volume
   - Test alerts after adjusting

3. **Battery Optimization:**
   - Exclude Chrome from battery optimization
   - Keep screen on or use "Stay awake" developer option

## 🎭 Voice Alert Types & Meanings

### Movement Alerts
- **"Motion detected"** - Something moved in the monitoring zone
- **"Significant movement"** - Large or fast movement detected
- **"Movement stopped"** - Activity has ceased after period of motion

### Zone Alerts
- **"Left the zone"** - Monitored subject moved outside designated area
- **"Returned to zone"** - Subject came back into monitoring area
- **"Zone boundary crossed"** - Movement detected at edge of zone

### System Alerts
- **"Monitoring started"** - Confirmation that monitoring is active
- **"Camera connection lost"** - Technical issue needs attention
- **"Low light detected"** - Lighting conditions may affect monitoring

### Custom Scenario Alerts
- **Pet monitoring:** "Pet is active", "Pet settled down", "Pet needs attention"
- **Baby monitoring:** "Baby is awake", "Baby is sleeping", "Check on baby"
- **Security monitoring:** "Movement detected", "Area secured", "Check camera"

## 🏠 Use Case Specific Setup

### Pet Sitting Setup
```
Recommended Settings:
✓ Immediate alerts for all movement
✓ Speaker volume at 60-70%
✓ Position speakers for whole-house coverage
✓ Test alerts from kitchen, bedroom, office
```

### Baby Monitoring Setup
```
Recommended Settings:
✓ Throttled alerts (avoid alert fatigue)
✓ Softer volume to avoid waking baby
✓ Wireless earbuds for silent monitoring option
✓ Test range from typical parent locations
```

### Security Monitoring Setup
```
Recommended Settings:
✓ Immediate alerts for any movement
✓ Maximum volume for attention-grabbing alerts
✓ Multiple audio devices if covering large area
✓ Test from farthest monitoring location
```

### Elder Care Setup
```
Recommended Settings:
✓ Movement and inactivity alerts
✓ Clear, slower speech for easy understanding
✓ Reliable speaker placement for caregiver areas
✓ Test emergency scenario response times
```

## 🔬 Advanced Configuration

### Browser-Specific Optimizations

**Chrome/Edge Advanced:**
- Enable "Use hardware acceleration" for better performance
- Add SpotKin to "Sites that can always use sound"
- Consider installing as PWA for dedicated audio handling

**Firefox Advanced:**
- Set `media.webspeech.synth.enabled` to `true` in about:config
- Ensure `dom.speechSynthesis.enabled` is `true`
- Clear audio cache if experiencing issues

**Safari Advanced:**
- Enable "Allow websites to access microphone" globally
- Use "Request Desktop Website" only if mobile version has issues
- Consider Safari Technology Preview for latest features

### Network Considerations

**Bandwidth Usage:**
- Voice alerts are generated locally (no internet required)
- Only initial page load requires network connection
- Works offline after first visit

**Latency Optimization:**
- Use wired internet connection for initial load
- Close bandwidth-heavy applications during setup
- Voice generation happens locally (no server delay)

## 📊 Testing & Validation Checklist

### Pre-Deployment Test
- [ ] Microphone permission granted
- [ ] System volume at appropriate level
- [ ] Test voice alert plays clearly
- [ ] Verify audio device routing
- [ ] Test from intended monitoring locations

### Real-World Validation
- [ ] Set up actual monitoring scenario
- [ ] Test alerts during typical activities
- [ ] Verify alerts audible from all necessary locations
- [ ] Confirm alerts don't disturb others inappropriately
- [ ] Test emergency response time

### Accessibility Verification
- [ ] Voice alerts clear for hearing impaired users
- [ ] Volume adjustable for different hearing levels
- [ ] Compatible with hearing aids if applicable
- [ ] Alternative notification methods if voice fails

## 🆘 Emergency Support

If voice alerts completely fail:
1. **Visual fallback** - SpotKin always shows visual notifications
2. **Refresh browser** - Reloads voice synthesis engine
3. **Check system audio** - Test with other audio sources
4. **Try different browser** - Some browsers handle voice synthesis differently
5. **Contact support** - Email support@endemicmedia.com with device/browser info

## 🎯 Pro Tips for Best Results

**Placement Tips:**
- Position speakers between monitoring area and your location
- Avoid placing speakers too close to monitored subjects
- Test alerts with background noise (TV, music, cooking)

**Environment Optimization:**
- Reduce echo in hard-surface rooms for clearer voice alerts
- Consider acoustic dampening for very reverberant spaces
- Test alerts during different times of day for noise variations

**Battery Life (Mobile):**
- Voice alerts use minimal battery compared to video processing
- Enable "Low Power Mode" in SpotKin settings for extended monitoring
- Keep device plugged in for long monitoring sessions

**Multi-Device Setup:**
- Use one device for monitoring, another for alerts if preferred
- Sync multiple devices to same monitoring session
- Test handoff between devices for continuous coverage

---

## 🚀 Ready to Monitor with Voice Alerts!

Voice alerts transform SpotKin from a screen-watching app into a true hands-free monitoring solution. With proper setup, you'll have clear, immediate spoken notifications that let you stay informed while living your life.

**Need help?** Email support@endemicmedia.com or use the feedback button in SpotKin for direct assistance.

**Want to share your setup?** We love hearing how people customize their voice alert configurations for different monitoring needs!