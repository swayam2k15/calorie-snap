# CalorieSnap 📸

Snap a photo of your meal → get instant calorie + macro estimates, powered by Gemini 2.5 Flash AI.

Built with **Expo** (iOS + Android + Web), **Supabase** (DB + Storage + Edge Functions), and **Google Gemini 2.5 Flash** — 100% free tier.

---

## Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) app on your phone (iOS or Android)
- A free [Supabase](https://supabase.com) account
- A free [Google AI Studio](https://aistudio.google.com) API key
- Supabase CLI — `npm install -g supabase`

---

## Running Locally (Step by Step)

### Step 1 — Clone & install

```bash
git clone <your-repo>
cd calorie-snap
npm install
```

### Step 2 — Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** and run the entire contents of `supabase/migrations/001_initial.sql`
   - This creates the `meals` table, storage bucket, and access policies
3. Go to **Settings → API** and copy:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon / public key**

### Step 3 — Set environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4 — Deploy the AI Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link to your project (find project-ref in Supabase Settings → General)
supabase link --project-ref your-project-ref

# Add your Gemini API key as a secret (get one free at aistudio.google.com)
supabase secrets set GEMINI_API_KEY=your-gemini-key

# Deploy the function
supabase functions deploy analyze-meal
```

### Step 5 — Start the app

```bash
npm start
```

Scan the QR code with **Expo Go** on your phone. That's it.

---

## Sharing with Friends

**Easiest (dev mode):**  
Run `npm start`, share the QR code. Friends install Expo Go and scan — app runs instantly on their phone.

**Standalone build (no Expo Go needed):**
```bash
npx eas build --profile development
# Creates an APK (Android) or IPA (iOS TestFlight)
```

**Push updates without rebuilding:**
```bash
npx eas update --branch main --message "fix: portion sizes"
# Update lands on all devices within 60 seconds, no app store review
```

---

## How It Works

```
User picks photo
      │
      ▼
Expo app uploads image → Supabase Storage (public bucket)
      │
      ▼
App calls Supabase Edge Function (analyze-meal)
      │
      ▼
Edge Function fetches image → base64 → Gemini 2.5 Flash API
      │
      ├─ Confident → returns dish, calories, macros
      │
      └─ Uncertain → returns 2-3 options (e.g. papaya vs mango)
                         │
                         ▼
                  User picks option → re-analyzes
      │
      ▼
User confirms → saved to Supabase PostgreSQL
```

---

## Project Structure

```
calorie-snap/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx      # Home: today's log + calorie/macro summary
│   │   ├── history.tsx    # All meals grouped by date
│   │   └── profile.tsx    # Stats: avg calories, top dish, weekly total
│   ├── scan.tsx           # Camera/gallery picker + upload to Supabase
│   └── result.tsx         # AI results, clarification flow, save
├── components/
│   ├── CalorieSummary.tsx  # Progress bar + macro breakdown card
│   ├── MealCard.tsx        # Single meal row with image + macros
│   ├── MacroBar.tsx        # Colored dot + value label
│   └── ClarificationModal.tsx  # Bottom sheet: pick between food options
├── lib/
│   ├── supabase.ts        # Supabase client
│   ├── types.ts           # TypeScript types (Meal, AnalysisResult, ...)
│   ├── constants.ts       # Colors, daily calorie goal, meal type helpers
│   ├── deviceId.ts        # UUID stored in AsyncStorage (anonymous user)
│   └── scanState.ts       # Module-level state: passes image URL scan→result
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql  # meals table + storage bucket — run in SQL Editor
│   └── functions/
│       └── analyze-meal/
│           └── index.ts     # Deno edge function: image → Gemini → JSON
├── .env.example           # Copy to .env and fill in keys
└── README.md
```

---

## Free Tier Limits (all services used)

| Service | Free Limit | This app's usage |
|---|---|---|
| Supabase DB | 500 MB | ~1 KB per meal row |
| Supabase Storage | 1 GB | ~200 KB per image → ~5,000 images |
| Supabase Edge Functions | Included | ~1 invocation per scan |
| Gemini 2.5 Flash | ~250 req/day | 10–30 scans/day typical |
| EAS Build | 30 builds/month | Only needed for standalone APK/IPA |

> **Supabase note**: Free projects pause after 1 week of inactivity. Wake them up from the Supabase dashboard (takes ~30 sec).

---

## Roadmap

**Phase 2 — Polish**
- Weekly calorie charts
- Portion size prompts ("Is this a small, medium, or large serving?")
- Multi-item plate detection with per-item calorie breakdown
- Common additions prompt (sauces, dressings)

**Phase 3 — Social & Auth**
- Google Sign-In via Supabase Auth
- Per-user history (replace device ID)
- Share meal cards as images
- Weekly friend leaderboard

**Phase 4 — Distribution**
- EAS Build → App Store + Play Store
- Sentry for crash monitoring
- Push notifications for daily calorie reminders
