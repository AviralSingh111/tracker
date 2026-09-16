# Tracker

A small in/out time tracker. Clock in and out, and it tells you how many
hours/day you need to average for the rest of the week to hit your target
(7h, 8h, or a custom value).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Firebase Auth (email/password + Google) and Firestore

## Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** → Sign-in method → Email/Password and Google.
3. Create a **Firestore Database** (production mode).
4. Deploy `firestore.rules` from this repo (or paste its contents into the
   Firestore Rules tab) so each user can only read/write their own data.
5. In Project Settings → General, add a Web App and copy its config values
   into a `.env` file at the project root (copy `.env.example` as a starting
   point):

   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

6. Install and run:

   ```
   npm install
   npm run dev
   ```

## Deploying to Vercel

`vercel.json` already pins the framework, build command, output directory,
SPA rewrites, and long-lived caching for hashed assets, so the only manual
steps are:

1. Import the repo at [vercel.com/new](https://vercel.com/new). The settings
   are picked up from `vercel.json` — don't override them in the dashboard.
2. Under **Settings → Environment Variables**, add the six `VITE_FIREBASE_*`
   values from your local `.env` for the Production, Preview, and Development
   environments. The build inlines them, so a change here needs a redeploy.
3. Deploy, then in the Firebase console go to **Authentication → Settings →
   Authorized domains** and add your Vercel domains (`<project>.vercel.app`,
   any preview domains you use, and your custom domain). Google sign-in fails
   with `auth/unauthorized-domain` until you do this.
4. Make sure `firestore.rules` is deployed — the client config below is public
   by design, and those rules are what actually protect each user's data.

Note that `VITE_`-prefixed variables are baked into the client bundle and are
visible to anyone who loads the page. That's expected for Firebase web config.

## How the average calculation works

The work week is Monday-Friday. At any point, the app sums the hours you've
logged so far this week (including today's in-progress session) and divides
the remaining target hours by the workdays left (including today) to tell
you the daily average you need going forward. If that number is above your
target, you'll see a banner and a browser notification.
