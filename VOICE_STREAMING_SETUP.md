# 🚀 Voice Streaming & Grok AI Setup Guide

## Overview

The enhanced Voice Financial Input feature now includes **real-time streaming field filling** powered by Grok AI. As you speak, fields are automatically filled in real-time without needing to stop and manually parse!

## New Features

### 1. 🌊 Streaming Mode (Real-time Field Filling)
- Fields are automatically filled **as you speak**
- No need to click "Parse with AI" button
- Visual indicators show which fields are being auto-filled
- Debounced parsing (waits 2 seconds after you stop talking)

### 2. ⚡ Live Mode Toggle
- Switch between "Live Mode" (streaming) and "Manual Mode"
- Click the chip in the top-right to toggle
- Manual mode requires clicking the AI button to parse

### 3. ✅ Visual Feedback
- Green "Auto-filled" badges appear on fields as they're populated
- Animated indicators show parsing in progress
- Field-level confidence scores (backend)

### 4. 🤖 Enhanced Grok AI Parsing
- Optimized prompts for partial transcripts
- Better field extraction and institution detection
- Field-level confidence scores
- Intelligent handling of incomplete sentences

## Setup Instructions

### Prerequisites
- Node.js and npm (for frontend)
- Python 3.8+ (for backend)
- Grok API Key from [X.AI](https://x.ai)

### Step 1: Get Your Grok API Key

1. Visit [https://console.x.ai](https://console.x.ai)
2. Sign up or log in to your X.AI account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `xai-...`)

### Step 2: Configure Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create or edit your `.env` file:
   ```bash
   # If you don't have a .env file
   cp env.example .env
   ```

3. Add your Grok API key to `.env`:
   ```env
   # Grok AI Configuration
   GROK_API_KEY=xai-your-actual-api-key-here
   ```

4. Restart your Django backend:
   ```bash
   python manage.py runserver
   ```

### Step 3: Test the Feature

1. Start the frontend (if not already running):
   ```bash
   cd frontend
   npm start
   ```

2. Navigate to **Accounts & Debts** page

3. Expand the **"🎤 Voice Input Financials"** accordion

4. Ensure "Live Mode" chip is active (green)

5. Click the microphone and start speaking:
   - "I have a Chase checking account with five thousand dollars"
   - Watch as fields fill automatically in real-time!

## How It Works

### Frontend Flow

```
User Speaks
    ↓
Web Speech API (Browser)
    ↓
Transcript Updated (Real-time)
    ↓
Debounce Timer (2 seconds)
    ↓
Send to Backend with streaming: true
    ↓
Receive Parsed Data
    ↓
Update Form Fields
    ↓
Show Visual Indicators
```

### Backend Flow

```
Receive Transcript + streaming flag
    ↓
Check for GROK_API_KEY
    ↓
If Available: Use Grok AI (optimized for streaming)
    ↓
If Not: Fallback to Regex Parser
    ↓
Return Structured JSON with field_confidence
```

## API Endpoints

### Parse Financial Voice (Enhanced)

**Endpoint:** `POST /api/mongodb/parse-financial-voice/`

**Request:**
```json
{
  "transcript": "I have a Chase checking account with $5,000",
  "streaming": true
}
```

**Response:**
```json
{
  "type": "account",
  "name": "Chase Checking",
  "amount": 5000.0,
  "category": "checking",
  "interest_rate": null,
  "effective_date": "2026-02-11",
  "payoff_date": null,
  "notes": "I have a Chase checking account with $5,000",
  "confidence": "high",
  "field_confidence": {
    "name": 95,
    "amount": 100,
    "category": 90,
    "interest_rate": 0
  }
}
```

## Configuration Options

### Frontend Settings (VoiceFinancialInput.js)

```javascript
// Streaming enabled by default
const [streamingEnabled, setStreamingEnabled] = useState(true);

// Debounce delay (milliseconds)
// Adjust this value to change how long to wait after user stops speaking
const PARSE_DELAY = 2000; // 2 seconds

// Minimum new characters before parsing
// Prevents too many API calls for small updates
const MIN_NEW_CHARS = 10;
```

### Backend Settings (voice_financial_parser.py)

The parser automatically detects if Grok API key is available:

```python
self.grok_api_key = os.getenv('GROK_API_KEY')
self.use_ai = bool(self.grok_api_key and 
                   self.grok_api_key != 'your_grok_api_key_here')
```

If no API key, it falls back to regex parsing automatically.

## Grok API Details

### Model Used
- **Model:** `grok-beta`
- **Temperature:** 0.1 (for consistent parsing)
- **Endpoint:** `https://api.x.ai/v1/chat/completions`

### API Pricing (as of Feb 2026)
- Check [X.AI Pricing](https://x.ai/pricing) for current rates
- Typical usage: ~100-200 tokens per parse
- Streaming mode may use more API calls

### Rate Limits
- Check your X.AI dashboard for current limits
- Recommended: Implement caching for repeated phrases
- Debounce helps prevent excessive API calls

## Troubleshooting

### Issue: "Grok AI parsing failed, falling back to regex"

**Causes:**
1. Invalid or missing API key
2. API rate limit exceeded
3. Network connection issues

**Solutions:**
1. Verify API key in `.env` file
2. Check X.AI dashboard for rate limits
3. Test with manual parse button first
4. Check backend logs: `python manage.py runserver`

### Issue: Fields not auto-filling in real-time

**Causes:**
1. Streaming mode is disabled
2. Not speaking long enough (< 10 chars)
3. Backend parsing error

**Solutions:**
1. Click "Live Mode" chip to enable streaming
2. Speak complete sentences
3. Check browser console (F12) for errors
4. Verify backend is running

### Issue: "Speech recognition is not supported"

**Causes:**
- Using unsupported browser (Firefox)

**Solutions:**
- Use Chrome, Edge, or Safari
- Manual typing still works with AI parsing

### Issue: Low confidence scores

**Causes:**
- Unclear speech
- Missing key information
- Background noise

**Solutions:**
- Speak clearly and at normal pace
- Include institution names
- Mention account/debt type explicitly
- State amounts with "dollars" or "$"

## Performance Optimization

### Reduce API Calls

1. **Increase debounce delay:**
   ```javascript
   // In VoiceFinancialInput.js
   parseTimeoutRef.current = setTimeout(() => {
     streamingParse(transcript);
   }, 3000); // Changed from 2000 to 3000ms
   ```

2. **Increase minimum character threshold:**
   ```javascript
   if (text.length - lastParsedLengthRef.current < 20) return;
   // Changed from 10 to 20
   ```

3. **Disable streaming for slow connections:**
   ```javascript
   const [streamingEnabled, setStreamingEnabled] = useState(false);
   ```

### Cache Parsed Results

Consider implementing caching in the backend:

```python
# In voice_financial_views.py
from django.core.cache import cache

def parse_financial_voice(request):
    transcript = request.data.get('transcript', '')
    
    # Check cache first
    cache_key = f"parse:{hash(transcript)}"
    cached_result = cache.get(cache_key)
    
    if cached_result:
        return Response(cached_result, status=status.HTTP_200_OK)
    
    # Parse and cache result
    parser = VoiceFinancialParser()
    result = parser.parse_transcript(transcript)
    cache.set(cache_key, result, timeout=3600)  # 1 hour
    
    return Response(result, status=status.HTTP_200_OK)
```

## Testing

### Manual Testing Checklist

- [ ] Backend is running with valid Grok API key
- [ ] Frontend is running
- [ ] Navigate to Accounts & Debts page
- [ ] Expand Voice Input section
- [ ] "Live Mode" chip is green
- [ ] Click microphone, grant permissions
- [ ] Speak: "I have a Chase checking account with five thousand dollars"
- [ ] Observe fields filling in real-time
- [ ] Green "Auto-filled" badges appear
- [ ] Stop recording
- [ ] Edit any fields if needed
- [ ] Click "Add Account" to save

### Example Test Phrases

**Accounts:**
- "I have a Chase checking account with $5,000"
- "My Bank of America savings has ten thousand dollars"
- "Fidelity investment account with $25,000"
- "Wells Fargo retirement account with $100,000 at 7%"

**Debts:**
- "I owe $3,000 on my Visa credit card at 18% interest"
- "Capital One credit card balance of $1,500"
- "Student loan of $30,000 at 5.5 percent"
- "Mortgage with Wells Fargo for $250,000 at 3.5%"

### Backend Unit Tests

```bash
cd backend/api
python voice_financial_parser.py
```

Expected output: All test cases should parse correctly.

## Security Considerations

### API Key Security

1. ✅ **Never commit API keys to Git:**
   ```bash
   # .gitignore already includes
   .env
   .env.local
   ```

2. ✅ **Use environment variables:**
   ```python
   self.grok_api_key = os.getenv('GROK_API_KEY')
   ```

3. ✅ **Validate API responses:**
   ```python
   if response.status_code != 200:
       raise Exception(f"Grok API error: {response.status_code}")
   ```

### Privacy

- ✅ Voice processing uses browser's Web Speech API
- ✅ Audio is NOT sent to servers
- ✅ Only text transcripts are sent to backend
- ✅ Transcripts are sent to Grok AI (X.AI) for parsing
- ✅ User data is isolated per account
- ✅ API requests require authentication

## Advanced Features

### Custom Parsing Rules

Edit `voice_financial_parser.py` to add custom keywords:

```python
# Add new institution
self.institutions.append('my_credit_union')

# Add new account type
self.account_keywords['crypto'] = ['bitcoin', 'ethereum', 'crypto']
```

### Field-Level Confidence Thresholds

Show warnings for low-confidence fields:

```javascript
// In VoiceFinancialInput.js
const showConfidenceWarning = (fieldName, confidence) => {
  if (confidence < 50) {
    return <Alert severity="warning">
      {fieldName} was detected with low confidence. Please verify.
    </Alert>
  }
};
```

## Roadmap

### Upcoming Features
- [ ] Multi-language support (Spanish, French, etc.)
- [ ] Voice feedback (text-to-speech confirmation)
- [ ] Bulk import (multiple accounts at once)
- [ ] Transaction parsing
- [ ] Budget category voice input
- [ ] Payment schedule extraction

## Support

### Resources
- [X.AI Documentation](https://docs.x.ai)
- [Web Speech API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [FinFreedom GitHub Issues](https://github.com/your-repo/issues)

### Getting Help

1. Check browser console for errors (F12)
2. Check backend logs
3. Verify API key in `.env`
4. Test with manual parse first
5. Open GitHub issue with:
   - Browser version
   - Example transcript
   - Error message
   - Screenshots

## License

This feature is part of the FinFreedom project and follows the same MIT license.

---

**Built with ❤️ for seamless voice-powered financial management**

Last Updated: February 11, 2026
