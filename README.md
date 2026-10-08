# greck. project dashboard

Shared dashboard for Brooke + Kenzie, tracking everything before the GRECK. pop-up (Dec 5–6, 2026).

- **Site:** https://brookerogersdesign.github.io/greck-dashboard/
- **Stack:** Vite (plain JS) → GitHub Pages; data in Supabase.
- **Access:** two passcodes. Brooke can edit everything. Kenzie can check off and update her own tasks, attach links, edit link URLs, and post notes.

## Run locally

```bash
npm install
npm run dev
```

With no `.env.local`, it runs in **demo mode**: data is saved in your browser only, and the passcodes are `brooke` / `kenzie`.

## One-time Supabase setup

1. Create a free project at supabase.com.
2. In **SQL Editor**, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Set real passcodes (also in SQL Editor):
   ```sql
   select dash_set_passcode('brooke', 'your-passcode');
   select dash_set_passcode('kenzie', 'her-passcode');
   ```
4. Copy **Project URL** and the **anon public key** from Project Settings → API.
   - Locally: put them in `.env.local` (see `.env.example`).
   - GitHub: Settings → Secrets and variables → Actions → **Variables** tab → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. GitHub: Settings → Pages → Source: **GitHub Actions**. Every push to `main` redeploys.

## How security works

The site is static, so the anon key is public. Every table has row-level security on and **no** policies, so the key alone can't read or write anything. All access goes through `dash_*` database functions that check the passcode (stored bcrypt-hashed) and the role before doing anything.

## Editing seed data

Tasks are edited in the dashboard itself. `src/seed.js` is only the starting data; after changing it, run `npm run seed-sql` to regenerate `supabase/seed.sql` (re-running that file **wipes** existing data).
