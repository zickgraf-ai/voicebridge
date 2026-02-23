# TapToSpeak - AAC Communication App

## Deployment
- **Production URL**: https://voicebridge-orcin.vercel.app
- **Version**: Defined in `package.json` `"version"` field, displayed at the bottom of Settings screen as "TapToSpeak v{version}"
- **Deploy workflow**: After any deploy, ALWAYS tell the user the version number so they can verify the correct build is running on their device. Bump the version in `package.json` when shipping meaningful changes.

## What This Is
TapToSpeak is an AI-powered AAC (Augmentative and Alternative Communication) app for people who temporarily or permanently cannot speak. The immediate user is a woman recovering from facial fracture surgery (broken jaw, broken wrist) who needs to communicate with caregivers and medical staff.

## Tech Stack
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Context + useReducer** for state management
- **localStorage** for persistence (MVP), migration path to IndexedDB later
- **Web Speech API** for text-to-speech
- **vite-plugin-pwa** for installable PWA
- **Vercel** for deployment

## Project Structure
```
voicebridge/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   ├── icon-512.png
│   └── sw.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css                  # Tailwind directives
    ├── context/
    │   └── AppContext.jsx         # Profile, Settings, History state
    ├── hooks/
    │   ├── useVoices.js           # Web Speech API voice loading + filtering
    │   ├── useSpeech.js           # speak(), cancel(), replay()
    │   └── useGridLayout.js       # Dynamic row calculation for zero-scroll
    ├── screens/
    │   ├── TalkScreen.jsx         # Main communication screen
    │   ├── ProfileScreen.jsx      # Identity, family, meds wizard
    │   ├── SettingsScreen.jsx     # All settings controls
    │   └── CareScreen.jsx         # Caregiver dashboard
    ├── components/
    │   ├── SpeechBar.jsx          # Editable speech bar (3 modes)
    │   ├── CategoryBar.jsx        # Configurable-size category tabs
    │   ├── PhraseGrid.jsx         # Paginated button grid
    │   ├── PhraseButton.jsx       # Individual phrase button with flash
    │   ├── PainScale.jsx          # 5x2 pain rating grid
    │   ├── PhraseBuilder.jsx      # Drill-down phrase builder
    │   ├── BottomNav.jsx          # 4-tab bottom navigation
    │   └── SegmentControl.jsx     # Reusable settings segment picker
    ├── data/
    │   ├── phrases.js             # All phrase categories and builders
    │   └── smartSuggest.js        # Time-of-day smart suggestions
    └── utils/
        ├── voiceFilter.js         # Filter to high-quality voices only
        ├── storage.js             # localStorage read/write helpers
        └── identity.js            # Generate identity phrase from profile
```

## Critical Design Constraints

### Zero-Scroll Talk Screen
The Talk screen must NEVER scroll. Everything must be visible at once. The grid dynamically measures available space using `100dvh` and calculates how many rows of 3 buttons fit. Pagination handles overflow. This is essential for accessibility — a user with a broken wrist cannot manage nested scroll areas.

### Touch Targets
Minimum 44px touch target per Apple HIG. Category tabs are configurable (Normal/Large/XL) because iPad users need bigger targets. Default to XL.

### Voice Filtering
Only show high-quality English voices. Filter to Google voices, Apple/Siri voices (Samantha, Alex, Karen, Daniel, Moira, Tessa, Fiona, Victoria, Ava, Zoe, Nicky), system default. Exclude Microsoft/eSpeak voices which sound terrible.

```javascript
function filterVoices(allVoices) {
  const good = allVoices.filter(v => {
    const name = v.name.toLowerCase();
    const isEnglish = v.lang.startsWith("en");
    const isGoogle = name.includes("google");
    const isApple = ["samantha","siri","alex","karen","daniel",
      "moira","tessa","fiona","victoria","ava","zoe","nicky"]
      .some(n => name.includes(n));
    const isDefault = v.default;
    return isEnglish && (isGoogle || isApple || isDefault);
  });
  if (good.length === 0) return allVoices.filter(v => v.lang.startsWith("en"));
  return good;
}
```

### Speech Bar (3 Modes)
1. **Empty**: "Tap here to type..." with keyboard icon
2. **Filled + auto-speak on**: Shows spoken text + replay + edit + clear buttons
3. **Edit mode**: Gold border, text becomes editable input, tapping phrase buttons APPENDS instead of replacing

### Identity Feature
Profile stores name, DOB, address. "My Info" button in Smart Suggest and Medical categories speaks all three. Nurses constantly ask for this info.

### Dark Theme
- Background: slate-950 (#0F172A)
- Cards: slate-800 (#1E293B)
- Borders: slate-700 (#334155)
- Text: slate-200 (#E2E8F0)
- Muted: slate-400 (#94A3B8)

### Settings That Must Work
- Auto-speak toggle (default: on)
- Voice picker dropdown (filtered)
- Speed: Slow (0.7) / Normal (0.9) / Fast (1.1)
- Category Tab Size: Normal / Large / XL (default: XL)
- Button Size: Normal / Large (default: Large)
- Pain reminder interval
- Caregiver alert threshold
- Test Voice button

## Data Models

### Profile
```javascript
{
  name: "Sarah",
  dob: "January 15, 1985",
  address: "123 Main St, City ST 12345",
  condition: "Jaw Surgery Recovery",
  familyMembers: [{ name, relationship, photo }],
  medications: [{ name, schedule, nextDose }]
}
```

### Settings
```javascript
{
  autoSpeak: true,
  voiceURI: "",
  voiceRate: 0.9,
  buttonSize: "large",
  tabSize: "xl",
  painReminder: 120,
  caregiverAlert: 6
}
```

### Communication History
```javascript
{
  id: "uuid",
  timestamp: "ISO",
  phrase: "I need water",
  category: "food",
  painLevel: null,
  source: "button" | "typed" | "builder"
}
```

## Reference
The file `reference-prototype.html` in the project root contains a fully working single-file prototype. Use it as the ground truth for behavior, layout, and interactions. Every feature in the prototype must work identically in the final app.

## PWA Requirements
- `manifest.json` with name, icons, theme_color, background_color
- Service worker for offline caching
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- Must work as "Add to Home Screen" on iOS/iPadOS Safari
