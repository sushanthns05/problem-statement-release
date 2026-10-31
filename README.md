# Lakshya 2026 — 24-Hour Hackathon Launch Countdown

An attractive, stage-ready single-page web app for the grand ceremonial launch of **Lakshya 2026** (24-Hour National Level Hackathon) on **5th & 6th November 2026**, hosted by the **Department of Information Science and Engineering**, **SJB Institute of Technology, Bengaluru**.

---

## 🌟 Event Day & Principal Inauguration Flow

1. **Inauguration / Pre-Launch Screen**
   - Futuristic cyber theme with deep navy background, atmospheric glowing particles, and central golden/green radial halo.
   - Fixed header bar with official department branding:
     - **SJBIT Silver Jubilee (25 Years) Emblem**
     - **SJB Institute of Technology Crest**
     - **Department of Information Science and Engineering Circular Emblem**
     - Department & College title: `DEPARTMENT OF INFORMATION SCIENCE AND ENGINEERING`, `SJB Institute of Technology, Bengaluru`
   - Event Hero badges: `LAKSHYA 2026 • SILVER JUBILEE EDITION` & `🗓 5th & 6th November 2026`.
   - Dignitary Invitation Callout: *"Hon'ble Principal & Dignitaries: Please click below to inaugurate"*.
   - **Ceremonial Launch Button**: Large neon green / gold glowing button: **`🚀 LAUNCH NOW`**.

2. **3-Second Inauguration Countdown (3... 2... 1...)**
   - The Principal clicks **`LAUNCH NOW`**.
   - Cinematic fullscreen 3-second sequence with expanding golden energy rings and high-contrast numerals (`3` &rarr; `2` &rarr; `1`).
   - Ascending Web Audio API synthesizer chimes (`660Hz` &rarr; `880Hz` &rarr; `1108Hz`).

3. **Glitter Eruption & Live 24-Hour Countdown Screen**
   - **Glitter Explosion**: The instant 3 seconds completes, a dense golden glitter explosion bursts across the entire screen (`✦`, `★`, diamond dust, and radiant light flares cascading for 10+ seconds).
   - **Triumphant Fanfare**: Web Audio API arpeggiated orchestral chime fanfare plays.
   - **Live Status Badge**: Switches immediately to pulsating **`🔴 LIVE: 24-HR COUNTDOWN`**.
   - **24-Hour Digital Clock**:
     - Large glowing Orbitron cards: **`HOURS`**, **`MINUTES`**, and **`SECONDS`** ticking down from `24 : 00 : 00`.
     - High-speed **`Centiseconds`** ticker (`.00` &rarr; `.99`) providing an active heartbeat feel.
   - **24-Hour Progress Bar**: Shows real-time progress (`0.0% Elapsed` &rarr; `100%`).
   - **Hackathon Milestones**:
     - **Phase 1 (00:00 - 04:00)**: Kickoff, Problem Formulation & Architecture Setup
     - **Phase 2 (04:00 - 12:00)**: First Mentorship Round & Core Implementation
     - **Phase 3 (12:00 - 20:00)**: Midnight Sprint & Mentor Review 2
     - **Finale (20:00 - 24:00)**: Code Freeze, Deployment & Grand Jury Pitching
   - **Persistence**: Launch timestamp is stored in `localStorage`. If the auditorium projector or browser tab is refreshed at any point during the 24 hours, the clock remains in exact sync!
   - **Stage & Rehearsal Controls**:
     - `⛶ Stage Mode`: 1-click fullscreen toggle for venue projectors.
     - `🔊 Sound`: Toggle audio effects.
     - `✨ Fire Glitter Shower`: Trigger extra glitter celebrations anytime.
     - `⏱ Test 10s Rehearsal`: Simulate the final 10 seconds before the main event.
     - `🔄 Reset Launch Ceremony`: Return to the pre-launch inauguration screen for the Principal.

---

## 📁 File Structure

```text
├── index.html                   # High-contrast stage-ready HTML shell
├── package.json                 # Project scripts (Vite & Vitest)
├── public/
│   └── assets/                  # High-resolution college & department logos
│       ├── sjbit-silver-jubilee-logo-clean.png
│       ├── sjbit-logo-clean.png
│       └── ise-dept-logo-clean.png
├── src/
│   ├── config.js                # Central event config (Name, dates, duration, milestones)
│   ├── style.css                # Dark cyber neon styling, glowing cards & responsive CSS
│   ├── main.js                  # Main controller, state router, audio, and clock engine
│   ├── timer.js                 # 24-Hour timer math, persistence, and formatting
│   ├── glitter.js               # Physics-based golden glitter and sparkle particle system
│   ├── particles.js             # Ambient background particle layer
│   └── audio.js                 # Web Audio API sound synthesizer (zero external MP3 files)
├── tests/
│   └── timer.test.js            # 11 Unit tests for 24-hour calculations and formatting
├── scripts/
│   └── verify-24h-flow.js       # Headless Chrome E2E test verifying full flow and mobile
└── README.md
```

---

## 🚀 Quick Start & Deployment

### 1. Install & Run Locally
```bash
npm install
npm run dev
```

### 2. Build for Production
```bash
npm run build
```
Generates zero-dependency static files in `dist/`, ready to drop into **Netlify**, **Vercel**, or **GitHub Pages**.

### 3. Run Unit Tests
```bash
npm test
```

### 4. Run E2E Verification
```bash
node scripts/verify-24h-flow.js
```
