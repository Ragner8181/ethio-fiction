# Ethio Fiction

A subscription reading app for 200+ Ethiopian fiction books — built with **Expo (React Native)** and **Supabase**.

This is a real, runnable starting point: authentication, the reader-facing screens (Home, Books, Favorites, Settings), and a role-gated Admin Panel (Payment Approval, Book Upload, Statistics) are all wired to a live Supabase backend. The visual design matches the approved mockup exactly (colors, type, copy).

---

## 1. Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- A free [Supabase](https://supabase.com) account
- A free [GitHub](https://github.com) account
- The **Expo Go** app on your phone (App Store / Play Store) — the easiest way to preview as you build
- (Optional) [Git](https://git-scm.com) installed locally

---

## 2. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Once it's created, open **SQL Editor** → **New query**, paste the entire contents of `supabase/schema.sql` from this repo, and click **Run**. This creates every table, security rule, and storage bucket the app needs.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public key**

---

## 3. Configure the app

1. In the project folder, copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste in your Supabase URL and anon key:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key
   ```
   `.env` is already in `.gitignore` — it will never be pushed to GitHub.

---

## 4. Install and run

```bash
npm install
npx expo start
```

- Scan the QR code with **Expo Go** on your phone to preview on a real device.
- Press `w` in the terminal to open it in a browser (useful for the Admin Panel — uploading PDFs is easier from a laptop).

---

## 5. Make yourself an admin

1. Register a normal account in the app first (Register screen).
2. In Supabase → **SQL Editor**, run:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Log out and back in — you'll now see the **Admin** tab with Payment Approval, Book Upload, and Statistics.

---

## 6. Upload your 200+ books

Use the Admin → **Book Upload** tab to add each title: name, author, cover image, and PDF. Mark exactly the books you want on the free plan using the "Make this one of the free-plan books" checkbox (the free plan shows the first 3 by default in the design — mark whichever 3 you like as free).

---

## 7. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Ethio Fiction app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ethio-fiction.git
git push -u origin main
```

---

## Project structure

```
ethio-fiction/
├── App.js                     # Entry point, loads fonts + providers
├── app.config.js              # Expo config, reads .env
├── src/
│   ├── lib/supabase.js        # Supabase client
│   ├── theme/                 # Colors, fonts, light/dark ThemeContext
│   ├── context/AuthContext.js # Sign up / sign in / sign out / profile/plan state
│   ├── navigation/            # Auth stack vs. main tabs (+ conditional Admin tab)
│   ├── components/UI.js       # Shared buttons, inputs, cards
│   └── screens/
│       ├── LoginScreen.js
│       ├── RegisterScreen.js
│       ├── HomeScreen.js
│       ├── BooksScreen.js
│       ├── FavoritesScreen.js
│       ├── SettingsScreen.js  # Profile / Payment / Statistics tabs + logout
│       └── admin/
│           ├── AdminPanelScreen.js
│           ├── PaymentApprovalTab.js
│           ├── BookUploadTab.js
│           └── StatisticsTab.js
└── supabase/schema.sql        # Full database schema + security rules
```

---

## Before you launch — things worth hardening

This starting point is fully functional but a few things are worth tightening before real users and real money are involved:

- **PDF access control.** The `pdfs` storage bucket is currently public so downloads are simple to implement. That means anyone with a direct file URL could bypass the paywall. For a real launch, switch to Supabase Edge Functions that check the requester's plan and return short-lived signed URLs instead.
- **Payment verification.** Approval is currently manual (by design, per your spec) — you review each screenshot/TXID yourself in the Admin Panel. If you later want automatic verification (e.g. via a payment gateway webhook), that's a separate integration.
- **Rate limiting / abuse.** Consider adding basic rate limits on sign-up and payment submission once you're live, to avoid spam accounts.

None of these block you from developing and testing today — they're the natural "harden before public launch" checklist.
