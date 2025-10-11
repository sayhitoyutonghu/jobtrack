# JobTrack Chrome Extension

AI-powered email classifier for Gmail that automatically categorizes job-related emails.

## Features

- 🏷️ **Auto-Classification**: Automatically classify emails when opened
- 🎨 **Visual Labels**: Color-coded category labels in Gmail
- 📊 **8 Categories**: Applied, Response Needed, Interview Scheduled, Offer, Rejected, Status Update, Recruiter Outreach, Job Alert
- ⚡ **Real-time API**: Powered by local Flask API with ML model
- 📈 **Statistics**: Track classification history and confidence scores

## Installation

### 1. Prerequisites

Make sure the Flask API is running:
```bash
cd d:\downloads\jobtrack
python app.py
```

The API should be running at `http://localhost:5000`

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder: `d:\downloads\jobtrack\chrome-extension`
5. The extension should now appear in your extensions list

### 3. Add Icons (Optional)

Create or download icons and place them in the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

For now, Chrome will use default icons if these are missing.

## Usage

### Automatic Classification

1. Open Gmail in Chrome
2. Click on any email
3. The extension will automatically classify it and show a colored label
4. The label appears below the email subject with the category and confidence score

### Manual Classification

Click the **"🏷️ Classify Email"** button in the Gmail toolbar to manually classify the current email.

### Extension Popup

Click the extension icon in Chrome toolbar to:
- Check API connection status
- View supported categories
- See classification statistics
- Toggle auto-classification on/off
- Test API connection
- Clear classification data

## Settings

- **Enable Extension**: Turn the extension on/off
- **Auto-Classify**: Automatically classify emails when opened (default: ON)

## Troubleshooting

### "API Disconnected" Error

1. Make sure Flask API is running: `python app.py`
2. Check that API is accessible at `http://localhost:5000`
3. Click "Test API Connection" in the extension popup

### Labels Not Showing

1. Refresh the Gmail page
2. Make sure the extension is enabled
3. Check browser console for errors (F12 → Console)

### CORS Errors

The Flask API already has CORS enabled via `flask-cors`. If you still see CORS errors:
1. Restart the Flask API
2. Reload the extension in Chrome

## API Endpoints Used

- `GET /health` - Check API status
- `GET /categories` - Get all categories
- `POST /predict` - Classify single email

## File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (API calls)
├── content.js          # Gmail integration
├── content.css         # Gmail UI styles
├── popup.html          # Extension popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── icons/              # Extension icons
└── README.md           # This file
```

## Development

To modify the extension:

1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the **Reload** button on the JobTrack extension
4. Refresh Gmail to see changes

## Privacy

- All data stays local (localhost API)
- No external servers or data collection
- Classification history stored in Chrome local storage
- Can be cleared anytime via extension popup
