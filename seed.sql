-- Run AFTER schema.sql, to fill sample Jaipur data so the site isn't empty.
-- Photos below use free placeholder images (picsum.photos) — replace with your real ones later via Admin.

insert into properties (title, area, type, price, availability, photos, videos, map_link, phone, whatsapp, custom_details, has_rooms) values
('2BHK Flat near Malviya Nagar', 'Malviya Nagar, Jaipur', 'flat', '₹14,000/month', true,
 'https://picsum.photos/seed/flat1a/800/600,https://picsum.photos/seed/flat1b/800/600',
 'https://youtu.be/dQw4w9WgXcQ',
 'https://maps.google.com/?q=Malviya+Nagar+Jaipur', '9999900001', '919999900001',
 '[{"key":"Security Deposit","value":"₹20,000","visible":true},{"key":"Rules","value":"No smoking inside","visible":true}]', false),

('Cozy Homestay in Vaishali Nagar', 'Vaishali Nagar, Jaipur', 'homestay', '₹1,500/night', true,
 'https://picsum.photos/seed/homestay1/800/600',
 '', 'https://maps.google.com/?q=Vaishali+Nagar+Jaipur', '9999900002', '919999900002',
 '[{"key":"Breakfast","value":"Included","visible":true}]', false),

('Hourly Stay Room - C-Scheme', 'C-Scheme, Jaipur', 'hourly', '₹400 for 3 hrs', true,
 'https://picsum.photos/seed/hourly1/800/600',
 '', 'https://maps.google.com/?q=C-Scheme+Jaipur', '9999900003', '919999900003',
 '[]', false),

('Residential Building - Mansarovar (24 Rooms)', 'Mansarovar, Jaipur', 'flat', 'Starting ₹6,000/room', true,
 'https://picsum.photos/seed/building1/800/600',
 '', 'https://maps.google.com/?q=Mansarovar+Jaipur', '9999900004', '919999900004',
 '[{"key":"Total Rooms","value":"24","visible":true}]', true),

('Residential Land Plot - Ajmer Road', 'Ajmer Road, Jaipur', 'land', '₹35 Lakh', true,
 'https://picsum.photos/seed/land1/800/600',
 '', 'https://maps.google.com/?q=Ajmer+Road+Jaipur', '9999900005', '919999900005',
 '[{"key":"Plot Size","value":"1200 sq.ft","visible":true},{"key":"Facing","value":"East","visible":true}]', false);

-- sample rooms for the Mansarovar building (id 4 — adjust if your id differs)
insert into rooms (property_id, title, rent, availability, photos, videos, custom_details)
select id, 'Room 101', '₹6,000/month', true, 'https://picsum.photos/seed/room101/800/600', '', '[]'::jsonb from properties where title = 'Residential Building - Mansarovar (24 Rooms)'
union all
select id, 'Room 102', '₹6,500/month', false, 'https://picsum.photos/seed/room102/800/600', '', '[]'::jsonb from properties where title = 'Residential Building - Mansarovar (24 Rooms)'
union all
select id, 'Room 103', '₹7,000/month', true, 'https://picsum.photos/seed/room103/800/600', '', '[]'::jsonb from properties where title = 'Residential Building - Mansarovar (24 Rooms)';

insert into tiffin (area, price, menu, whatsapp, availability) values
('Malviya Nagar', '₹2,500/month (2 meals)', 'Roti, sabzi, dal, rice — veg only', '919999900010', true),
('Vaishali Nagar', '₹2,800/month (2 meals)', 'Veg + occasional sweet', '919999900011', true),
('Mansarovar', '₹2,200/month (1 meal)', 'Lunch only — roti, sabzi, dal', '919999900012', true);

insert into inventory (item, price, photos, availability, whatsapp) values
('Gas Cylinder (14kg, used)', '₹900', 'https://picsum.photos/seed/cylinder/800/600', true, '919999900020'),
('Chulha (2-burner stove)', '₹600', 'https://picsum.photos/seed/chulha/800/600', true, '919999900020'),
('Steel Utensil Set', '₹1,200', 'https://picsum.photos/seed/utensils/800/600', true, '919999900020'),
('Bedding Set (mattress+pillow)', '₹1,500', 'https://picsum.photos/seed/bedding/800/600', false, '919999900020'),
('Bicycle (used, good condition)', '₹2,000', 'https://picsum.photos/seed/bike/800/600', true, '919999900020');
