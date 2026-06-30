-- ===================================================================
-- RUN THIS ONCE in Supabase: Dashboard > SQL Editor > New query > Paste > Run
-- ===================================================================

-- 1. PROPERTIES (flats / homestays / hourly / land)
create table properties (
  id bigint generated always as identity primary key,
  title text not null,
  area text not null,
  type text not null default 'flat',        -- flat / homestay / hourly / land
  price text,
  availability boolean default true,
  photos text,                               -- comma-separated image URLs
  videos text,                               -- comma-separated YouTube/Drive links
  map_link text,
  phone text,
  whatsapp text,
  custom_details jsonb default '[]',         -- [{"key":"security","value":"Yes","visible":true}]
  has_rooms boolean default false,
  created_at timestamptz default now()
);

-- 2. ROOMS (linked to a property, for multi-room buildings)
create table rooms (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete cascade,
  title text not null,
  rent text,
  availability boolean default true,
  photos text,
  videos text,
  custom_details jsonb default '[]',
  created_at timestamptz default now()
);

-- 3. TIFFIN SERVICE
create table tiffin (
  id bigint generated always as identity primary key,
  area text not null,
  price text,
  menu text,
  whatsapp text,
  availability boolean default true,
  created_at timestamptz default now()
);

-- 4. INVENTORY (cylinder, chulha, utensils, bike etc.)
create table inventory (
  id bigint generated always as identity primary key,
  item text not null,
  price text,
  photos text,
  availability boolean default true,
  whatsapp text,
  created_at timestamptz default now()
);

-- 5. INQUIRIES (public "list your property" / general query form)
create table inquiries (
  id bigint generated always as identity primary key,
  name text,
  phone text,
  type text,        -- "list_property" / "general"
  message text,
  created_at timestamptz default now()
);

-- ===================================================================
-- SECURITY: public can READ listings, only logged-in ADMIN can write
-- ===================================================================
alter table properties enable row level security;
alter table rooms enable row level security;
alter table tiffin enable row level security;
alter table inventory enable row level security;
alter table inquiries enable row level security;

-- Public read access
create policy "public read properties" on properties for select using (true);
create policy "public read rooms" on rooms for select using (true);
create policy "public read tiffin" on tiffin for select using (true);
create policy "public read inventory" on inventory for select using (true);

-- Public can SUBMIT an inquiry, but not read others' inquiries
create policy "public insert inquiries" on inquiries for insert with check (true);

-- Only logged-in admin can write/edit/delete listings
create policy "admin write properties" on properties for all using (auth.role() = 'authenticated');
create policy "admin write rooms" on rooms for all using (auth.role() = 'authenticated');
create policy "admin write tiffin" on tiffin for all using (auth.role() = 'authenticated');
create policy "admin write inventory" on inventory for all using (auth.role() = 'authenticated');
create policy "admin read inquiries" on inquiries for select using (auth.role() = 'authenticated');
create policy "admin delete inquiries" on inquiries for delete using (auth.role() = 'authenticated');

-- ===================================================================
-- STORAGE: a public bucket to upload photos directly from the admin page
-- (Run this too — or create bucket "photos" manually in Storage tab, set Public)
-- ===================================================================
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "public view photos" on storage.objects for select using (bucket_id = 'photos');
create policy "admin upload photos" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "admin delete photos" on storage.objects for delete using (bucket_id = 'photos' and auth.role() = 'authenticated');
