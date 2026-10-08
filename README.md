# Ausome Apps

An AU-some pair of phone-friendly apps behind one login: a time tracker and a single master to-do list.

Hours and the to-do list are stored in Supabase and stay tied to your login, so the same data shows up on your phone and your computer. The site itself is static and hosted on GitHub Pages.

## Use it

Open the site and sign in. After login, switch between **Ausome Time Tracker** and **Ausome To-Do List**.

Today is selected by default on the tracker. Use the arrows or tap the date to change days. Add a number of hours, with at most one decimal place, and an optional note. Tap an entry to change or delete it.

The to-do list is one continuous note. It auto-saves as you type. Press Enter to continue a `- `, `1. `, or `a. ` list. Use Bold and Italic, or Ctrl/Cmd+B and I. Tap **Save** if you want to save immediately.

## One-time setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). If you already created the hours table, run [`supabase/add-todo-notes.sql`](supabase/add-todo-notes.sql) to add the master to-do list. That script is safe to run more than once. If you already created the table with start and end times, run [`supabase/migrate-to-hours.sql`](supabase/migrate-to-hours.sql) as well. If the to-do table exists but saving still fails, run [`supabase/repair-todo-notes.sql`](supabase/repair-todo-notes.sql).
3. Under **Authentication → Users**, add your email and password. Under **Authentication → Sign In / Providers**, turn off **Confirm email** and **Allow new users to sign up**.
4. In the GitHub repo, add Actions secrets:
   - `VITE_SUPABASE_URL` — the project URL (`https://something.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — the publishable key (`sb_publishable_...`) or the anon key
5. Under **Settings → Pages**, set the source to **GitHub Actions**.

Copy the URL and key from the green **Connect** button, then **API Keys**. Do not put the secret key or the service role key in GitHub.

For local development, copy `.env.example` to `.env.local` and fill in the same two values.

A push to `main` builds the app and publishes it. The site is `https://<your-github-username>.github.io/AusomeTimeTracker/`. If you add the secrets after the first deploy, run the **Deploy** workflow again so the keys are baked into the site.

A free Supabase project pauses after about a week with no traffic. Opening the app wakes it. The first load can take a minute.
