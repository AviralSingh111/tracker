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

## How the average calculation works

The work week is Monday-Friday. At any point, the app sums the hours you've
logged so far this week (including today's in-progress session) and divides
the remaining target hours by the workdays left (including today) to tell
you the daily average you need going forward. If that number is above your
target, you'll see a banner and a browser notification.
