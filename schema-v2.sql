-- ===================================================================
-- ONE3 STAY — CLEAN DATABASE RESET (v2)
-- Run this in Supabase → SQL Editor → New query → paste ALL → Run
-- This DROPS your old (broken) tables and rebuilds everything correctly.
-- Your real listings are NOT lost — restore them after this with
-- migrate-real-data.sql (built from your last export).
-- ===================================================================

drop table if exists rooms cascade;
drop table if exists properties cascade;
drop table if exists tiffin cascade;
drop table if exists inventory cascade;
drop table if exists services cascade;
drop table if exists quick_contacts cascade;
drop table if exists inquiries cascade;
drop table if exists settings cascade;

-- ===================================================================
-- 1. SETTINGS (site-wide config editable from Admin > Settings tab)
-- ===================================================================
create table settings (
  key text primary key,
  value text
);
insert into settings (key, value) values
  ('business_name', 'One3 Stay'),
  ('tagline', 'Flats · Homestays · Hourly Stays · Land for Sale · Tiffin Service'),
  ('default_tab', 'properties');

-- ===================================================================
-- 2. PROPERTIES
-- ===================================================================
create table properties (
  id bigint generated always as identity primary key,
  title text not null,
  area text not null,
  type text not null default 'flat',        -- flat / homestay / hourly / land
  price text,
  availability boolean default true,
  photos text,                               -- comma-separated URLs, FIRST one = cover/main photo
  videos text,
  map_link text,
  phone text,
  whatsapp text,
  custom_details jsonb default '[]',         -- [{"key":"Security","value":"...","visible":true}]
  has_rooms boolean default false,
  pinned boolean default false,              -- show first / "Featured" ribbon
  sort_order int default 0,                  -- lower = earlier, used within pinned/unpinned groups
  created_at timestamptz default now()
);

create table rooms (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete cascade,
  title text not null,
  rent text,
  availability boolean default true,
  photos text,
  videos text,
  phone text,       -- optional; leave blank to use the parent property's phone
  whatsapp text,     -- optional; leave blank to use the parent property's whatsapp
  custom_details jsonb default '[]',
  pinned boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ===================================================================
-- 3. TIFFIN
-- ===================================================================
create table tiffin (
  id bigint generated always as identity primary key,
  area text not null,
  price text,
  menu text,
  phone text,
  whatsapp text,
  photos text,
  availability boolean default true,
  pinned boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ===================================================================
-- 4. INVENTORY (cylinder / chulha / utensils / bike etc.)
-- ===================================================================
create table inventory (
  id bigint generated always as identity primary key,
  item text not null,
  price text,
  photos text,
  phone text,
  whatsapp text,
  availability boolean default true,
  pinned boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ===================================================================
-- 5. SERVICES ("Extra services we provide")
-- ===================================================================
create table services (
  id bigint generated always as identity primary key,
  item text not null,               -- e.g. "Rental & Legal Drafting"
  description text,
  price text,
  photos text,
  phone text,
  whatsapp text,
  availability boolean default true,
  pinned boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ===================================================================
-- 6. QUICK CONTACTS ("Are you a broker/tenant/... chat with us")
-- ===================================================================
create table quick_contacts (
  id bigint generated always as identity primary key,
  role text not null,               -- "Broker", "Tenant", "Supplier"...
  message text,                     -- prefilled WhatsApp message
  whatsapp text,
  icon text default '💬',
  sort_order int default 0
);

-- ===================================================================
-- 7. INQUIRIES (public "list your property" / general query form)
-- ===================================================================
create table inquiries (
  id bigint generated always as identity primary key,
  name text,
  phone text,
  type text,
  message text,
  created_at timestamptz default now()
);

-- ===================================================================
-- SECURITY (RLS): public can READ everything, only admin can WRITE
-- ===================================================================
alter table properties enable row level security;
alter table rooms enable row level security;
alter table tiffin enable row level security;
alter table inventory enable row level security;
alter table services enable row level security;
alter table quick_contacts enable row level security;
alter table inquiries enable row level security;
alter table settings enable row level security;

create policy "public read properties" on properties for select using (true);
create policy "public read rooms" on rooms for select using (true);
create policy "public read tiffin" on tiffin for select using (true);
create policy "public read inventory" on inventory for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read quick_contacts" on quick_contacts for select using (true);
create policy "public read settings" on settings for select using (true);

create policy "public insert inquiries" on inquiries for insert with check (true);

create policy "admin write properties" on properties for all using (auth.role() = 'authenticated');
create policy "admin write rooms" on rooms for all using (auth.role() = 'authenticated');
create policy "admin write tiffin" on tiffin for all using (auth.role() = 'authenticated');
create policy "admin write inventory" on inventory for all using (auth.role() = 'authenticated');
create policy "admin write services" on services for all using (auth.role() = 'authenticated');
create policy "admin write quick_contacts" on quick_contacts for all using (auth.role() = 'authenticated');
create policy "admin write settings" on settings for all using (auth.role() = 'authenticated');
create policy "admin read inquiries" on inquiries for select using (auth.role() = 'authenticated');
create policy "admin delete inquiries" on inquiries for delete using (auth.role() = 'authenticated');

-- ===================================================================
-- STORAGE (photos bucket) — safe to re-run, skips if it already exists
-- ===================================================================
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "public view photos" on storage.objects;
drop policy if exists "admin upload photos" on storage.objects;
drop policy if exists "admin delete photos" on storage.objects;

create policy "public view photos" on storage.objects for select using (bucket_id = 'photos');
create policy "admin upload photos" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "admin delete photos" on storage.objects for delete using (bucket_id = 'photos' and auth.role() = 'authenticated');

-- ===================================================================
-- SEED: Quick Contacts (broker/tenant/supplier/interior/lawyer) — edit anytime in Admin
-- Replace 919999900000 with your real WhatsApp numbers per role, or leave one number for all.
-- ===================================================================
insert into quick_contacts (role, message, whatsapp, icon, sort_order) values
('Broker', 'Hi, I am a broker and I''m interested in your listings.', '919999900000', '🤝', 1),
('Tenant', 'Hi, I am looking for a place to rent / stay.', '919999900000', '🏠', 2),
('Supplier', 'Hi, I am a supplier and would like to connect.', '919999900000', '📦', 3),
('Interior Partner', 'Hi, I do interior work and would like to partner with you.', '919999900000', '🎨', 4),
('Lawyer Partner', 'Hi, I am a lawyer and would like to partner with you.', '919999900000', '⚖️', 5);

-- ===================================================================
-- SEED: Services — edit prices/whatsapp/photos anytime in Admin
-- ===================================================================
insert into services (item, description, whatsapp, sort_order) values
('Rental & Legal Drafting', 'Rent agreements, notices, and other legal drafting for landlords and tenants.', '919999900000', 1),
('Trademark Registration', 'End-to-end trademark search, filing and registration support.', '919999900000', 2),
('Website Building', 'Simple websites for your business, like this one.', '919999900000', 3),
('Packers & Movers', 'Reliable packing and moving service, local and outstation.', '919999900000', 4),
('RO / AC Service', 'Installation, repair and annual maintenance for RO and AC units.', '919999900000', 5),
('Electrician', 'On-call electrician for repairs, wiring, and fittings.', '919999900000', 6),
('Cleaning Service', 'Deep cleaning and regular housekeeping for homes and offices.', '919999900000', 7),
('Lift Service', 'Maintenance and repair for building lifts/elevators.', '919999900000', 8),
('Tile Installation', 'Flooring and wall tile installation by experienced workers.', '919999900000', 9),
('Interior Consultation', 'Design consultation for homes, flats, and PGs.', '919999900000', 10),
('End-to-End PG/Rental Maintenance', 'Full upkeep of PGs and rental units — repairs, cleaning, tenant handling.', '919999900000', 11),
('Gemstones', 'Certified gemstones — buy and consultation.', '919999900000', 12),
('Bulk Anaj & Spices', 'Wholesale grains and spices supply.', '919999900000', 13),
('Bulk Building Material', 'Wholesale cement, sand, bricks and other construction material.', '919999900000', 14);
