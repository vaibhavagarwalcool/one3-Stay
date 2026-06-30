# Your Property + Tiffin + Inventory Website — Setup Guide

Everything here is **100% free**: GitHub Pages (hosting) + Supabase (database, auth, photo storage).
Total cost: ₹0/month for your scale (16-30 listings + photos).

---

## WHAT YOU GOT

- `index.html` — public site (Properties / Tiffin / Inventory / List-Your-Property form)
- `admin.html` — password-protected admin panel to add/edit/delete everything, no coding needed
- `assets/` — styling + logic files
- `schema.sql` — creates your database tables (run once)
- `seed.sql` — sample Jaipur data so the site isn't empty on day one (delete later from Admin)

---

## STEP 1 — Create your free Supabase project (the database)

1. Go to https://supabase.com → Sign up (free) → "New Project"
2. Pick any project name + a strong database password (save it somewhere) → choose the region closest to India (Singapore) → Create.
3. Wait ~2 minutes for it to finish setting up.

## STEP 2 — Create the tables

1. In your Supabase project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `schema.sql` from this folder, copy all of it, paste into the SQL editor, click **Run**.
3. Repeat: open `seed.sql`, paste, **Run** — this loads the sample Jaipur listings.

## STEP 3 — Create your admin login

1. In Supabase, go to **Authentication → Users → Add User**.
2. Enter your email + a password you'll remember. Click **Create User**. Tick "Auto Confirm User" if asked.
3. This email+password is what you'll use to log into `admin.html`. (You can add more admin users the same way if you have staff.)

## STEP 4 — Create the public photo storage bucket (if not auto-created)

The `schema.sql` script already tries to create a bucket called **photos**. To confirm:
1. Go to **Storage** in Supabase → you should see a bucket named `photos` marked **Public**.
2. If it's missing: click **New bucket** → name it exactly `photos` → toggle **Public bucket** ON → Create.

## STEP 5 — Connect your site to Supabase

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `assets/config.js` in this folder and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi.....";
   ```
4. Also change `BUSINESS_NAME` in the same file to your real business name.

> These two values are safe to put in public code — Supabase's security rules (already set up by schema.sql) control what the public key is allowed to do (read listings, submit inquiries) vs what only your logged-in admin account can do (add/edit/delete).

## STEP 6 — Put it on GitHub Pages (free hosting, free link)

1. Go to https://github.com → sign up free if you don't have an account.
2. Click **+ → New repository**. Name it e.g. `my-properties`. Keep it **Public**. Create.
3. On the new repo page, click **uploading an existing file** (or "Add file → Upload files").
4. Drag in ALL the files/folders from this package (`index.html`, `admin.html`, `assets/` folder, `schema.sql`, `seed.sql`, `README.md`) → Commit.
5. Go to **Settings → Pages** (left sidebar of the repo).
6. Under "Build and deployment" → Source: **Deploy from a branch**. Branch: `main`, folder `/ (root)`. Save.
7. Wait 1-2 minutes. Your link will appear at the top, like:
   `https://yourusername.github.io/my-properties/`
8. Your **admin panel** will be at:
   `https://yourusername.github.io/my-properties/admin.html`

That's it — share the first link with tenants/brokers, and bookmark the second one for yourself only.

> Want a shorter link to share on WhatsApp? Free options: tinyurl.com, is.gd, or bitly.com — paste your GitHub Pages link in and get a short one.

---

## HOW TO ADD YOUR REAL PHOTOS & VIDEOS

**Photos — 2 options:**
- **Easiest:** In `admin.html`, when adding/editing a property, room, or item, use the "Or upload photos directly" file picker — select multiple photos from your phone/computer, they upload straight to your free Supabase storage and attach automatically. (Free tier = 1GB, roughly 1,000-2,000 phone photos — plenty for 16-30 listings.)
- **Alternative:** Upload photos anywhere that gives a public link (Google Photos "share" link, imgbb.com, Google Drive set to "Anyone with link") and paste the links into the "Photos (comma-separated URLs)" box instead.

**Videos — use YouTube (free, unlimited, no storage limits):**
1. Upload your property walkthrough video to YouTube.
2. Set visibility to **Unlisted** (not searchable, but anyone with the link can view).
3. Copy the video link (e.g. `https://youtu.be/xxxxxxx`) and paste it into the "Videos" field in Admin.
4. You can also use a Google Drive link (set sharing to "Anyone with the link can view") if you prefer not to use YouTube.

---

## HOW TO USE THE ADMIN PANEL DAY-TO-DAY

1. Go to your `admin.html` link → log in with the email/password from Step 3.
2. **Properties tab** — Add New Property for each flat/homestay/hourly-stay/land. Tick "This property has multiple rooms" only for buildings like your 24-room one.
3. **Rooms tab** — pick the multi-room property from the dropdown, then add each room (own photos, rent, availability) individually.
4. **Tiffin tab** / **Inventory tab** — same idea, simpler forms.
5. **Custom Details** — on any property/room, click "+ Add Detail Row" to add anything you think of later (Security, Rules, Parking, Water Timing, etc.) with a show/hide toggle — so you're never stuck with fixed fields again.
6. **Inquiries tab** — see every "List your property" / general query submitted from the public site, with a one-tap WhatsApp reply button.
7. Toggle "Available" off instead of deleting when something is rented/sold — keeps your history clean.

Changes show up on your public site within a few seconds — no need to re-upload anything to GitHub again.

---

## ABOUT THE "DIFFERENT WHATSAPP NUMBER PER LISTING"

Every property/room/tiffin-area/inventory item has its **own WhatsApp number field** in the admin form — so you can assign a different number per listing whenever you're ready. Until then, just put the same number everywhere, or leave them blank and fill in as you go (the WhatsApp button simply won't work until a number is added).

---

## OPTIONAL UPGRADES LATER (still free)

- **Custom domain:** Buy a domain (~₹600-1000/yr, not free) and point it at GitHub Pages — only step that costs money, and entirely optional.
- **QR code for your link:** Use a free generator like https://www.qr-code-generator.com — print it and stick it at your properties.
- **Multiple admins:** Add more users in Supabase Authentication for family/staff to manage listings.

---

## TROUBLESHOOTING

- **"Could not load data" on the site:** double-check `assets/config.js` has the correct Supabase URL + anon key (Step 5), no extra spaces/quotes issues.
- **Admin login fails:** make sure the user was created in Supabase Authentication (Step 3), and "Auto Confirm User" was checked (otherwise it expects email confirmation, which needs email sending set up — auto-confirm avoids that).
- **Photos not showing after upload:** confirm the `photos` storage bucket is set to **Public** (Step 4).
- **Changes not appearing on the public site:** hard-refresh the page (Ctrl/Cmd+Shift+R) — browsers sometimes cache the page.
