# Ausome Time Tracker

An AU-some lightweight time tracking application. Each day can have several entries. The screen shows totals for that day, its Monday–Sunday week, and its calendar month.

Hours are stored in Supabase and stay tied to your login, so the same entries show up on your phone and your computer. The site itself is static and hosted on GitHub Pages.

## Use it

Open the site and sign in. Today is selected by default. Use the arrows or tap the date to change days. Add a number of hours, with at most one decimal place, and an optional note. Tap an entry to change or delete it.

## One-time setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). If you already created the table with start and end times, run [`supabase/migrate-to-hours.sql`](supabase/migrate-to-hours.sql) instead.
3. Under **Authentication → Users**, add your email and password. Under **Authentication → Sign In / Providers**, turn off **Confirm email** and **Allow new users to sign up**.
4. In the GitHub repo, add Actions secrets:
   - `VITE_SUPABASE_URL` — the project URL (`https://something.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — the publishable key (`sb_publishable_...`) or the anon key
5. Under **Settings → Pages**, set the source to **GitHub Actions**.

Copy the URL and key from the green **Connect** button, then **API Keys**. Do not put the secret key or the service role key in GitHub.

For local development, copy `.env.example` to `.env.local` and fill in the same two values.

A push to `main` builds the app and publishes it. The site is `https://<your-github-username>.github.io/AusomeTimeTracker/`. If you add the secrets after the first deploy, run the **Deploy** workflow again so the keys are baked into the site.

A free Supabase project pauses after about a week with no traffic. Opening the app wakes it. The first load can take a minute.
