# 🎤 Voice Input Setup & Testing Guide

## Quick Setup (5 minutes)

### Step 1: Verify Backend Files ✅

All backend files have been created:
- ✅ `backend/api/voice_financial_parser.py` - AI parsing engine
- ✅ `backend/api/voice_financial_views.py` - API endpoints
- ✅ `backend/api/mongodb_urls.py` - URL routing (updated)
- ✅ `backend/api/test_voice_parser.py` - Test script

### Step 2: Verify Frontend Files ✅

All frontend files have been created:
- ✅ `frontend/src/components/VoiceFinancialInput.js` - Voice input component
- ✅ `frontend/src/components/AccountsAndDebts.js` - Updated with voice input

### Step 3: Test the Backend Parser

```bash
# Navigate to backend API directory
cd C:\Users\mccar\Financibility-FinFreedom\backend\api

# Run the test script
python test_voice_parser.py
```

**Expected Output:**
```
==================================================================================================
VOICE FINANCIAL PARSER TEST SUITE
==================================================================================================

Test Case 1:
Input: "I have a Chase checking account with $5,000"
----------------------------------------------------------------------------------------------------
Parsed Result:
  Type: account
  Name: Chase Checking
  Amount: $5000.0
  Category: checking
  Interest Rate: None
  Confidence: HIGH

✅ TEST PASSED
==================================================================================================
...
```

### Step 4: Start the Backend Server

```powershell
# Navigate to backend directory
cd C:\Users\mccar\Financibility-FinFreedom\backend

# Activate virtual environment (if you have one)
# venv\Scripts\activate

# Start Django server
python manage.py runserver 127.0.0.1:8000
```

**Verify it's running:**
- Open browser: http://127.0.0.1:8000/api/mongodb/
- You should see: `{"status": "healthy", "message": "MongoDB API is running"}`

### Step 5: Start the Frontend

```powershell
# Open a NEW terminal/PowerShell window
cd C:\Users\mccar\Financibility-FinFreedom\frontend

# Install dependencies (if needed)
npm install

# Start React dev server
npm start
```

**Verify it's running:**
- Browser should automatically open: http://localhost:3000
- Or manually open: http://localhost:3000

### Step 6: Test the Voice Input Feature

1. **Login** to your FinFreedom account
2. Navigate to **"Monthly Budget"** page
3. Look for the **purple gradient accordion** that says:
   ```
   🎤 Voice Input Budget [AI Powered]
   ```
4. Click to expand it
5. **Grant microphone permissions** (browser will ask)
6. Click the **green microphone button** 🎙️
7. **Speak clearly**: 
   ```
   "My monthly income is $5,000, I spend $1,500 on rent, $400 on food, and $300 on transportation"
   ```
8. Click the **red stop button** when done
9. Watch the AI parse your input! 🤖
10. Review the parsed data
11. Click **"Apply to Budget"** to fill in the budget fields

## Browser Compatibility Check

### ✅ Chrome/Edge (Recommended)
```javascript
// Open Console (F12) and run:
'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
// Should return: true
```

### ✅ Safari
```javascript
// Open Console (F12) and run:
'webkitSpeechRecognition' in window
// Should return: true
```

### ❌ Firefox
Firefox doesn't support Web Speech API. Use Chrome, Edge, or Safari instead.

## Testing Voice Commands

### Test Budget Inputs:

1. **Simple Income:**
   ```
   "My monthly income is $5,000"
   ```
   Expected: Income = $5,000

2. **Multiple Expenses:**
   ```
   "I spend $1,500 on rent, $400 on food, and $300 on transportation"
   ```
   Expected: Housing = $1,500, Food = $400, Transportation = $300

3. **Comprehensive Budget:**
   ```
   "My income is $6000, rent is $1800, groceries $500, car payment $400, utilities $200, and entertainment $150"
   ```
   Expected: Income = $6,000, Housing = $1,800, Food = $500, Transportation = $400, Utilities = $200, Entertainment = $150

4. **With Savings:**
   ```
   "I make $7000, spend $2000 on housing, $600 on food, and save $500 for emergencies"
   ```
   Expected: Income = $7,000, Housing = $2,000, Food = $600, Emergency Fund = $500

5. **Short Form:**
   ```
   "5k income, 1500 rent, 400 groceries"
   ```
   Expected: Income = $5,000, Housing = $1,500, Food = $400

## Troubleshooting

### Issue: "Speech recognition is not supported"

**Solution:**
- Use Chrome, Edge, or Safari
- Update browser to latest version
- Refresh the page

### Issue: Microphone permission denied

**Solution:**
1. Click the microphone icon in browser address bar
2. Select "Allow"
3. Refresh the page
4. Try again

### Issue: No sound detected

**Solution:**
- Check microphone is working (test in other apps)
- Check microphone volume (Windows Sound Settings)
- Speak closer to microphone
- Reduce background noise

### Issue: Parsing not accurate

**Solution:**
- Speak more clearly
- Mention institution name: "Chase", "Bank of America"
- Mention account type: "checking", "credit card"
- Say amount clearly: "five thousand dollars" or "five thousand"
- Include interest if known: "at 5%" or "5 percent"
- Edit the parsed fields manually before saving

### Issue: Backend error when parsing

**Check Django logs:**
```bash
# In the terminal where Django is running, look for error messages
```

**Common fixes:**
- Restart Django server
- Check MongoDB connection
- Verify user is authenticated (logged in)

### Issue: Component not showing

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors (F12)
4. Verify `VoiceFinancialInput.js` exists in `frontend/src/components/`

## API Testing (Advanced)

### Test Parse Endpoint:

```bash
# Get your access token from browser localStorage
# Then run:

curl -X POST http://127.0.0.1:8000/api/mongodb/parse-financial-voice/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"transcript": "I have a Chase checking account with $5,000"}'
```

**Expected Response:**
```json
{
  "type": "account",
  "name": "Chase Checking",
  "amount": 5000.0,
  "category": "checking",
  "interest_rate": null,
  "effective_date": "2024-02-09",
  "payoff_date": null,
  "notes": "I have a Chase checking account with $5,000",
  "confidence": "high"
}
```

### Test Voice Examples Endpoint:

```bash
curl http://127.0.0.1:8000/api/mongodb/voice-examples/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Console Debugging

Open browser console (F12) and check for:

### Successful Voice Input:
```
✅ User authenticated, loading budget data...
🔄 Loading budget data from MongoDB Atlas...
✅ Voice data parsed: {type: "account", name: "Chase Checking", ...}
✅ Voice data submitted, refreshing...
```

### Errors to Look For:
```
❌ Speech recognition error: ...
❌ Error parsing transcript: ...
❌ Failed to save financial data: ...
```

## Performance Metrics

Expected timings:
- Voice recognition: Real-time (0ms latency)
- Stop recording → Parse: < 1 second
- Parse → Display results: < 0.5 seconds
- Submit → Save: < 1 second
- **Total time**: ~2-3 seconds from speech to saved!

## Feature Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend running on port 3000
- [ ] Logged into FinFreedom account
- [ ] Navigated to Monthly Budget page
- [ ] Voice Input Budget accordion visible
- [ ] Microphone permissions granted
- [ ] Successfully recorded voice input
- [ ] AI parsed the transcript correctly
- [ ] Budget fields auto-filled
- [ ] Budget saved successfully

## Success Indicators

You know it's working when:

1. ✅ **Microphone button pulses red** when recording
2. ✅ **Transcript appears in real-time** as you speak
3. ✅ **AI parsing shows chips** with detected data:
   - Type: account/debt
   - Name: institution + type
   - Amount: $X,XXX
   - Category: checking/credit-card/etc.
4. ✅ **Form auto-fills** with parsed data
5. ✅ **Success message** appears after saving
6. ✅ **New item shows** in accounts/debts list

## Tips for Best Results

1. **Speak naturally** - Don't over-enunciate
2. **Include institution name** - "Chase", "Bank of America"
3. **Mention account/debt type** - "checking", "credit card"
4. **State amount clearly** - "five thousand dollars" or "$5,000"
5. **Add interest if known** - "at 5%" or "5 percent"
6. **Review before saving** - Always check the parsed data

## Example Session

```
User: [Clicks microphone]
🎙️ Recording...

User: "My monthly income is $5,000, I spend $1,500 on rent, $400 on food, and $300 on transportation"
📝 Transcript: "My monthly income is $5,000, I spend $1,500 on rent, $400 on food, and $300 on transportation"

🤖 AI Processing...
✅ Parsed successfully!

Detected:
- Income: $5,000
- Housing: $1,500
- Food: $400
- Transportation: $300

User: [Reviews, clicks "Apply to Budget"]
✅ Voice input applied! Check your budget fields below.

Budget fields auto-filled!
User: [Reviews budget, clicks "Save Budget"]
✅ Budget saved successfully!
```

## Next Steps

After setup:
1. ✅ Test with multiple voice commands
2. ✅ Try different account/debt types
3. ✅ Experiment with various amounts
4. ✅ Share feedback on accuracy
5. ✅ Report any issues or bugs

## Support

If you encounter issues:
1. Check this guide first
2. Review console logs (F12)
3. Test with simple commands first
4. Try manual entry as fallback
5. Report bugs with examples

---

**🎉 Congratulations!** You now have AI-powered voice input for your financial management! Speak your way to financial freedom! 🚀
