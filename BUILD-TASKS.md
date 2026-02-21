# VoiceBridge — Build Tasks

Run these phases in order. After each phase, verify everything works before moving on.

---

## Phase 1: Scaffold & Foundation

1. Initialize Vite + React project:
   ```
   npm create vite@latest . -- --template react
   ```
2. Install dependencies:
   ```
   npm install
   npm install -D tailwindcss @tailwindcss/vite
   ```
3. Configure Tailwind in `vite.config.js`:
   ```javascript
   import tailwindcss from '@tailwindcss/vite'
   export default defineConfig({
     plugins: [react(), tailwindcss()]
   })
   ```
4. Set up `src/index.css` with Tailwind import:
   ```css
   @import "tailwindcss";
   ```
5. Create the project directory structure from CLAUDE.md
6. Create `src/context/AppContext.jsx` with:
   - Profile state (name, dob, address, condition, familyMembers, medications)
   - Settings state (all settings from CLAUDE.md with defaults)
   - Communication history array
   - localStorage persistence — load on mount, save on change
7. Create utility files:
   - `src/utils/voiceFilter.js` — voice filtering logic from CLAUDE.md
   - `src/utils/storage.js` — localStorage helpers with JSON parse/stringify safety
   - `src/utils/identity.js` — getIdentityPhrase(profile)
8. Create hooks:
   - `src/hooks/useVoices.js` — load + filter voices, handle voiceschanged event
   - `src/hooks/useSpeech.js` — speak(text), cancel(), uses settings from context
   - `src/hooks/useGridLayout.js` — ref-based measurement, returns { gridRef, rows }
9. **Verify**: `npm run dev` loads without errors, context provides state

---

## Phase 2: Talk Screen (Core Experience)

This is the most important screen. Reference `reference-prototype.html` for exact behavior.

1. Create `src/data/phrases.js` — all categories, smart suggest (morning/afternoon/evening), builders
2. Create `src/data/smartSuggest.js` — time-of-day logic
3. Build components in this order:
   a. `PhraseButton.jsx` — icon + label, green flash on tap (200ms), configurable size
   b. `PhraseGrid.jsx` — 3-column grid, dynamic rows from useGridLayout, pagination with dots + arrows
   c. `PainScale.jsx` — 5×2 grid, color-coded 1-10, speaks "My pain is X out of 10"
   d. `PhraseBuilder.jsx` — starter selection → follow-up grid, back button, combines phrase
   e. `SpeechBar.jsx` — 3 modes (empty/filled/editing), handles append-on-tap during edit
   f. `CategoryBar.jsx` — horizontal scrolling tabs, size from settings (Normal/Large/XL)
   g. `BottomNav.jsx` — 4 tabs (Talk/Profile/Settings/Care)
4. Assemble `TalkScreen.jsx`:
   - Layout: SpeechBar → CategoryBar → Grid area (flex:1, overflow:hidden)
   - NO SCROLLING on this screen — grid area measures available space
   - "My Info" button triggers identity phrase
   - Pain button shows PainScale overlay
   - Auto-speak on tap when enabled
   - Edit mode: tapping buttons appends to speech bar text
5. Wire up `App.jsx` with BottomNav routing between screens (simple state, no router needed)
6. **Verify**: All phrase categories work, speech works, pagination works, pain scale works, builder works, edit+append works, zero scroll on mobile viewport
7. **Deploy & test on iPad**: Run `npx vercel` to deploy, open URL on iPad Safari to verify touch targets and speech

---

## Phase 3: Profile, Settings, Care Screens

1. `ProfileScreen.jsx` — 4-step wizard:
   - Step 1 "Identity": Name, DOB, Address, Condition (with condition quick-picks), preview of "My Info" phrase
   - Step 2 "Family": List existing + add new with relationship quick-pick buttons (Husband, Wife, Partner, Mom, Dad, Son, Daughter, Sister, Brother, Friend, Doctor, Nurse, Therapist, Aide, Grandma, Grandpa) OR custom text input
   - Step 3 "Meds": List existing + add new (name, schedule)
   - Step 4 "Connect": Placeholder cards for Google Contacts, Calendar, Apple Health, Facebook
   - Progress bar at top, Back/Next navigation
2. `SettingsScreen.jsx` — all settings from CLAUDE.md:
   - Auto-speak toggle with visual switch
   - Voice picker dropdown (filtered voices)
   - Speed segment (Slow/Normal/Fast)
   - Test Voice button
   - Category Tab Size segment (Normal/Large/XL)
   - Button Size segment (Normal/Large)
   - Pain Reminder segment
   - Caregiver Alert segment
3. `CareScreen.jsx` — caregiver dashboard:
   - Patient header (avatar, name, condition)
   - Overview/Activity tab toggle
   - Overview: 2×2 stat cards (phrases today, pain level, next med, food intake %)
   - Activity: timestamped log of communications
   - For MVP, use mock data — real data comes from communication history in Phase 4
4. **Verify**: Profile saves to localStorage and persists on reload, settings changes reflect immediately on Talk screen, identity phrase updates when profile changes
5. **Deploy & test**: `npx vercel` — verify settings and profile work on iPad

---

## Phase 4: PWA & Deploy

1. Install PWA plugin:
   ```
   npm install -D vite-plugin-pwa
   ```
2. Configure in `vite.config.js`:
   ```javascript
   import { VitePWA } from 'vite-plugin-pwa'
   export default defineConfig({
     plugins: [
       react(),
       tailwindcss(),
       VitePWA({
         registerType: 'autoUpdate',
         manifest: {
           name: 'VoiceBridge',
           short_name: 'VoiceBridge',
           description: 'AAC Communication App',
           theme_color: '#0F172A',
           background_color: '#0F172A',
           display: 'standalone',
           orientation: 'any',
           icons: [
             { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
             { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
           ]
         },
         workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,svg}']
         }
       })
     ]
   })
   ```
3. Create placeholder icons in `public/` (simple colored squares with "VB" text — can be replaced later)
4. Add meta tags to `index.html`:
   ```html
   <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   <meta name="theme-color" content="#0F172A">
   ```
5. Wire up communication history logging — every button tap, typed message, and builder phrase gets logged with timestamp
6. Connect CareScreen to real history data
7. Build and test:
   ```
   npm run build
   npm run preview
   ```
8. **Final deploy & verify**: `npx vercel --prod` — open on iPad Safari → Share → Add to Home Screen. Verify PWA launches full-screen, works offline after first load, all data persists

---

## Quality Checklist

Before considering each phase done, verify:
- [ ] No console errors
- [ ] No scrolling on Talk screen at any viewport size
- [ ] Touch targets are at least 44px
- [ ] Speech works (test with Test Voice button)
- [ ] Auto-speak toggles correctly
- [ ] Category tab size setting changes immediately
- [ ] Profile data persists after page reload
- [ ] Settings persist after page reload
- [ ] "My Info" speaks name + DOB + address
- [ ] Pain scale returns to phrase grid after selection
- [ ] Phrase builder combines starter + follow-up correctly
- [ ] Edit mode appends button text to speech bar
- [ ] Pagination shows correct number of pages per category
- [ ] Dark theme throughout, no white flashes
