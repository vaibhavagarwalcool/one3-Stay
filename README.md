# One3 Stay — v2 Setup & Upgrade Guide

This is a full rebuild of your site with everything you asked for. Still **100% free**
(GitHub Pages + Supabase), still no domain needed.

---

## 0. WHAT CHANGED / WHAT'S NEW

- **Shareable listings** — every property, room, tiffin area, inventory item, and service
  has a 🔗 **Share** button. It opens the phone's native share sheet (or copies a direct
  link) that opens straight to that one listing, for anyone, even people who've never
  visited your site.
- **Tap a card → full detail view** in a clean pop-up sheet, with all photos, full text,
  and every custom detail — no more cut-off long descriptions.
- **Fixed long-text display** — any custom detail longer than ~50 characters (like a full
  paragraph description) now renders as its own readable block instead of a squashed row.
- **Rooms are now a proper button** ("🚪 View Rooms in this Building") that opens a full
  grid of room cards (photo, rent, availability, call/WhatsApp/share) — not a tiny text link.
- **Pinning + sort order** — mark any listing "Pinned" to always show it first, with a
  ⭐ Featured ribbon, and fine-tune order with a Sort Order number.
- **Set main photo** — in Admin, every photo has a ★ button to make it the cover photo.
- **Duplicate button** — clone any listing to quickly create a similar one.
- **Search everything** — search box now matches title, area, type, AND any custom detail
  text/key, not just title/area.
- **Sort dropdown** — Featured first / Newest / Price low-high / Price high-low.
- **Call + WhatsApp + Share on every category** — properties, rooms, tiffin, inventory,
  and the new services section all have consistent action buttons.
- **Quick Contacts strip** — "Broker / Tenant / Supplier / Interior Partner / Lawyer
  Partner — chat with us" buttons right under the search bar, each opening WhatsApp with
  a role-specific prefilled message. Fully editable (add more roles) from Admin.
- **New "Services" tab** — rental & legal drafting, trademark registration, website
  building, packers & movers, RO/AC service, electrician, cleaning, lift service, tile
  installation, interior consultation, end-to-end PG/rental maintenance, gemstones, bulk
  anaj & spices, bulk building material — all pre-loaded, editable, with WhatsApp inquire.
- **Default tab** — choose which tab (Properties/Tiffin/Items/Services/Form) opens first,
  from Admin → Settings.
- **Full backup/export** — one button in Admin downloads a JSON file of every table, so
  you never lose your filled-in data even if you redesign the site later.
- **Nicer UI** — gradient header, featured ribbons, availability chips, "posted X ago",
  card hover effects, bottom-sheet modals — closer to OLX/99acres/MagicBricks style.

---

## 1. FIX YOUR DATABASE (the SQL you ran wrong)

You currently have a working database with some real listings in it, so we won't nuke
everything blindly — we'll rebuild the structure cleanly and put your real listings back.

1. Supabase → **SQL Editor** → New query.
2. Open **`schema-v2.sql`** from this package → copy all → paste → **Run**.
   This drops the old/broken tables and creates the new clean ones (with pinning, sort
   order, services, quick contacts, settings, etc.) — including sample "Services" and
   "Quick Contacts" rows you can edit.
3. New query → open **`migrate-real-data.sql`** → copy all → paste → **Run**.
   This restores your real listings (Raja Park flat, Sanganer 24-room building + its
   3 rooms, Vaishali Nagar land plot, tiffin areas, inventory items) into the new schema,
   with the correct pinned/sort order already set.
4. Double-check in **Table Editor** that `properties`, `rooms`, `tiffin`, `inventory`,
   `services`, `quick_contacts`, `settings`, `inquiries` all exist and have rows.

> Note: your query `SELECT * FROM inquires;` had a typo — the table is spelled
> **`inquiries`** (with the second "i"). That's likely why it errored.

---

## 2. UPDATE YOUR SITE FILES

1. Open `assets/config.js` in this package.
2. It already has your Project URL (`https://lqxepeolwteqnmdusqcs.supabase.co`) filled in
   — you just need to paste your **anon public key** (Supabase → Project Settings → API)
   in place of `PASTE-YOUR-ANON-PUBLIC-KEY-HERE`.
3. Confirm `SITE_BASE_URL` matches your real GitHub Pages URL:
   `https://vaibhavagarwalcool.github.io/one3-Stay/` (already set — update only if it
   ever changes).
4. Upload **all files in this package** to your GitHub repo (`one3-Stay`), overwriting the
   old ones — `index.html`, `admin.html`, the whole `assets/` folder. GitHub Pages will
   redeploy automatically in about a minute.

---

## 3. MAKE YOUR REPO PRIVATE (hide your source code)

Good news — GitHub Pages works fine with a **private** repository on the free plan; your
site stays public and viewable by anyone with the link, but nobody can see your source
code, file structure, or admin.js logic on GitHub.

1. Go to `https://github.com/vaibhavagarwalcool/one3-Stay` → **Settings** (top of repo).
2. Scroll to the **Danger Zone** at the bottom → **Change visibility** → **Make private**.
3. Confirm. Your GitHub Pages link keeps working exactly the same — only the code view
   on GitHub itself becomes private.

> One caveat: your Supabase **anon key** is still visible to anyone who opens your
> browser's dev tools while using the live site (this is normal and safe — it's a
> public-by-design key, and your actual data access is controlled by the RLS policies
> in `schema-v2.sql`, not by hiding the key).

---

## 4. BACKING UP / EXPORTING YOUR DATA

You now have **two ways** to back up everything you've filled in:

**A. One-click from your own Admin panel (recommended)**
Admin → top-right → **⬇️ Export Full Backup (JSON)**. Downloads a single file with every
property, room, tiffin area, inventory item, service, quick contact, and setting. Keep
these files safe — if you ever rebuild the UI again, this JSON is everything needed to
re-populate it.

**B. Directly from Supabase (per table)**
Table Editor → open a table → **⋮ menu → Export data as CSV**. Do this per table if you
want spreadsheet-style backups instead of JSON.

> Supabase's free tier doesn't include automatic daily database backups — exporting
> manually every so often (e.g. after a big round of edits) is the free way to stay safe.

---

## 5. HOW SHARING WORKS

Every card has a 🔗 **Share** button.
- On a phone, it opens the native share sheet — the person can send the direct link over
  WhatsApp, SMS, email, anywhere.
- On a desktop browser, it copies the link to the clipboard and shows "✅ Copied".
- The link looks like: `https://vaibhavagarwalcool.github.io/one3-Stay/?type=property&id=9`
- Opening that link loads your whole site as normal, but automatically pops up the detail
  view for that exact listing — so anyone can view and share individual flats, rooms,
  tiffin areas, items, or services without needing to browse the whole site.

---

## 6. PINNING, SORT ORDER & DEFAULT TAB

- **Pinned** (checkbox on any property/room/tiffin/inventory/service form): pinned items
  always show first, with a ⭐ Featured ribbon on properties.
- **Sort Order** (number field): within the pinned group and within the unpinned group,
  lower numbers show earlier. Leave at 0 if you don't care about fine ordering.
- **Default Tab**: Admin → ⚙️ Settings → pick which tab (Properties/Tiffin/Items for
  Sale/Services/List-Inquire) visitors see first when they open your site.

---

## 7. SETTING THE MAIN / COVER PHOTO

In any Add/Edit form with photos, you'll see thumbnails under **Photos**. The first one
(marked "MAIN") is what shows on the card and as the top of the gallery. Click **★** on
any other photo to make it the new main photo instantly — no re-uploading needed.

---

## 8. DUPLICATING A LISTING

Every properties/rooms/tiffin/inventory/services list in Admin now has a **Duplicate**
button next to Edit/Delete. It opens the Add form pre-filled with all the same details
(title gets "(Copy)" appended) — just tweak what's different (e.g. area, price, photos)
and Save to create a new listing quickly.

---

## 9. QUICK CONTACTS ("Are you a broker/tenant/...")

Admin → 💬 Quick Contacts. Comes pre-loaded with Broker, Tenant, Supplier, Interior
Partner, and Lawyer Partner — each with its own emoji, prefilled WhatsApp message, and
number. Edit the WhatsApp numbers to your real ones, add more roles (e.g. "Painter",
"Photographer") anytime, and reorder with Sort Order.

---

## 10. THE NEW "SERVICES" SECTION

Admin → 🛠️ Services. Pre-loaded with all 14 services you listed (rental/legal drafting,
trademark registration, website building, packers & movers, RO/AC service, electrician,
cleaning, lift service, tile installation, interior consultation, PG/rental maintenance,
gemstones, bulk anaj & spices, bulk building material). Edit descriptions, prices, and
WhatsApp numbers per service, or add new ones — each gets its own card with a WhatsApp
Inquire button on the public site's "🛠️ Services" tab.

---

## 11. UPLOADING PHOTOS & VIDEOS (unchanged, still free)

- **Photos:** use the file picker in any Admin form — uploads straight to your free
  Supabase Storage (1GB free ≈ 1,000–2,000 phone photos). Or paste public image links
  (Google Photos share link, imgbb.com, Drive "Anyone with link").
- **Videos:** upload to YouTube as **Unlisted**, paste the link. Or use a Google Drive
  link set to "Anyone with the link can view."

---

## TROUBLESHOOTING

- **"Could not load data"** → double-check `assets/config.js` has the right anon key.
- **Admin login fails** → confirm the user exists in Supabase → Authentication → Users,
  with "Auto Confirm User" ticked.
- **Shared link doesn't open the right listing** → make sure `SITE_BASE_URL` in
  `assets/config.js` exactly matches your live GitHub Pages URL (including trailing `/`).
- **Photos not showing after upload** → confirm the `photos` Storage bucket is Public
  (schema-v2.sql creates/re-confirms this automatically).
- **Changes not showing on the public site** → hard refresh (Ctrl/Cmd+Shift+R).
