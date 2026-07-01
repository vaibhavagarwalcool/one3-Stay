-- ===================================================================
-- RESTORE YOUR REAL DATA — run this AFTER schema-v2.sql
-- Rebuilt from your latest CSV export, mapped into the new tables.
-- Placeholder/sample entries you never customized are included too —
-- just delete the ones you don't want from Admin.
-- ===================================================================

-- ---------- PROPERTIES ----------
insert into properties (id, title, area, type, price, availability, photos, videos, map_link, phone, whatsapp, custom_details, has_rooms, pinned, sort_order, created_at) values
(6, '2BHK Flat For Rent 1st floor Raja Park JMD', 'Raja Park, Jaipur', 'flat', '₹23,000/month', true,
 'https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849201290_y8kg2d8nnwr_1000000581.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849203214_8w1baouws4_1000000586.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849204720_oobco8l9bf_1000001167.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849206899_zna9qytipj_1000000589.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849209129_1i4ggvukugb_1000001156.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849210465_6u5ebi3rtfo_1000001166.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849212309_l74jyzdemtf_1000001160.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782849213644_71d1wv6rii6_1000001161.jpg',
 '', 'https://maps.app.goo.gl/cMcZMTwaPH9cZcjM6', '7790905888', '+917790905888',
 $j$[{"key":"Security","value":"₹23000","visible":true},{"key":"Description","value":"2bhk flat available near pink square mall, raja park, jaipur  2 bhk Fully furnished, ventilated, newly constructed, Newly painted , ac, fridge, ro ,sofa ,centre table, wardrobe  available for bachelors, students, family, working people, fully independent flat jai mata di apartment car parking - only open bike parking -  available covered  available immediately ready to shift","visible":true},{"key":"Floor","value":"1st","visible":true},{"key":"Location","value":"Raja Park","visible":true},{"key":"Unit","value":"2bhk flat","visible":true},{"key":"Nearby","value":"Pink square mall, hospital, school, park , bus stand, airport etc.","visible":true},{"key":"bike parking","value":"available covered","visible":true},{"key":"Car parking","value":"not available covered","visible":true},{"key":"posted by","value":"owner","visible":true},{"key":"preference","value":"any","visible":true},{"key":"pets","value":"not allowed","visible":true}]$j$::jsonb,
 false, true, 1, '2026-06-30 19:11:10.955399+00'),

(9, 'Residential Building - Sanganer (24 Rooms)', 'Sanganer, Jaipur', 'flat', 'Starting ₹10,000/room', true,
 'https://picsum.photos/seed/building1/800/600',
 '', 'https://maps.google.com/?q=Mansarovar+Jaipur', '9251181111', '+919251181111',
 $j$[{"key":"Total Rooms","value":"24","visible":true},{"key":"Location","value":"Sanganer","visible":true},{"key":"Nearby","value":"Airport","visible":true},{"key":"Home Stay","value":"yes","visible":true},{"key":"Airbnb","value":"Yes","visible":true},{"key":"rental","value":"yes","visible":true},{"key":"hourly basis","value":"yes","visible":true},{"key":"locality","value":"posh","visible":true}]$j$::jsonb,
 true, true, 2, '2026-06-30 19:11:10.955399+00'),

(10, 'Residential Land Plot for Sale - Vaishali Nagar', 'Vaishali Nagar, near Hanuman nagar extension', 'land', '80000/gaj', true,
 'https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782850281132_vp85o8sjjmp_1000001874.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782850282090_ngx729k9np_1000001938.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782850282418_q9a8camqcah_1000001820.jpg,https://lqxepeolwteqnmdusqcs.supabase.co/storage/v1/object/public/photos/1782850282809_tuxpte2qbsd_1000001172.jpg',
 '', 'https://maps.app.goo.gl/xndqacPB4m6UXsyf9', '7790905888', '+917790905888',
 $j$[{"key":"Plot Size","value":"200 gaz","visible":true},{"key":"Facing","value":"East","visible":true},{"key":"asking","value":"80000/gaj","visible":true},{"key":"Description","value":"Google maps location https://maps.app.goo.gl/xndqacPB4m6UXsyf9 *colony* : om nagar colony adjacent to hanuman nagar vistar and vaishali nagar *highlights* : main 160 ft se corner se 2nd plot near 200 ft bypass ajmer road 10 min distance to Jaipur railway station and bus stand close to sanskar school *details* land / plot for sale in om nagar colony near hanuman nagar extension kirni phatak jda approved, 30*60 size, 200 gaz, 30ft road size of colony entrance from 160 ft main road corner se 2nd plot landmark : 2nd plot from safed mandir","visible":true},{"key":"Posted by","value":"owner","visible":true},{"key":"patta","value":"jda","visible":true},{"key":"colony","value":"om nagar colony","visible":true}]$j$::jsonb,
 false, false, 3, '2026-06-30 19:11:10.955399+00'),

(7, 'Cozy Homestay in Vaishali Nagar', 'Vaishali Nagar, Jaipur', 'homestay', '₹1,500/night', true,
 'https://picsum.photos/seed/homestay1/800/600', '', 'https://maps.google.com/?q=Vaishali+Nagar+Jaipur', '9999900002', '919999900002',
 $j$[{"key":"Breakfast","value":"Included","visible":true}]$j$::jsonb, false, false, 4, '2026-06-30 19:11:10.955399+00'),

(8, 'Hourly Stay Room - C-Scheme', 'C-Scheme, Jaipur', 'hourly', '₹400 for 3 hrs', true,
 'https://picsum.photos/seed/hourly1/800/600', '', 'https://maps.google.com/?q=C-Scheme+Jaipur', '9999900003', '919999900003',
 '[]'::jsonb, false, false, 5, '2026-06-30 19:11:10.955399+00');

select setval('properties_id_seq', (select max(id) from properties));

-- ---------- ROOMS (linked to property 9 — Sanganer building) ----------
insert into rooms (id, property_id, title, rent, availability, photos, videos, custom_details, sort_order, created_at) values
(1, 9, 'Room 101', '₹10,000/month', true, 'https://picsum.photos/seed/room101/800/600', '', $j$[{"key":"floor","value":"ground floor","visible":true}]$j$::jsonb, 1, '2026-06-30 19:11:10.955399+00'),
(2, 9, 'Room 201', '₹9,000/month', false, 'https://picsum.photos/seed/room102/800/600', '', $j$[{"key":"floor","value":"2nd","visible":true}]$j$::jsonb, 2, '2026-06-30 19:11:10.955399+00'),
(3, 9, 'Room 301', '₹7,000/month', true, 'https://picsum.photos/seed/room103/800/600', '', $j$[{"key":"floor","value":"3rd","visible":true}]$j$::jsonb, 3, '2026-06-30 19:11:10.955399+00');

select setval('rooms_id_seq', (select max(id) from rooms));

-- ---------- TIFFIN ----------
insert into tiffin (id, area, price, menu, whatsapp, availability, sort_order, created_at) values
(4, 'Raja Park, Jaipur', '₹2,500/month (2 meals)', 'Roti, sabzi, dal, rice — veg only', '+917790905888', true, 1, '2026-06-30 20:15:55.747091+00'),
(1, 'Malviya Nagar', '₹2,500/month (2 meals)', 'Roti, sabzi, dal, rice — veg only', '919999900010', true, 2, '2026-06-30 19:11:10.955399+00'),
(2, 'Vaishali Nagar', '₹2,800/month (2 meals)', 'Veg + occasional sweet', '919999900011', true, 3, '2026-06-30 19:11:10.955399+00'),
(3, 'Mansarovar', '₹2,200/month (1 meal)', 'Lunch only — roti, sabzi, dal', '919999900012', true, 4, '2026-06-30 19:11:10.955399+00');

select setval('tiffin_id_seq', (select max(id) from tiffin));

-- ---------- INVENTORY ----------
insert into inventory (id, item, price, photos, availability, whatsapp, sort_order, created_at) values
(1, 'Gas Cylinder (14kg, used)', '₹900', 'https://picsum.photos/seed/cylinder/800/600', true, '919999900020', 1, '2026-06-30 19:11:10.955399+00'),
(2, 'Chulha (2-burner stove)', '₹600', 'https://picsum.photos/seed/chulha/800/600', true, '919999900020', 2, '2026-06-30 19:11:10.955399+00'),
(3, 'Steel Utensil Set', '₹1,200', 'https://picsum.photos/seed/utensils/800/600', true, '919999900020', 3, '2026-06-30 19:11:10.955399+00'),
(4, 'Bedding Set (mattress+pillow)', '₹1,500', 'https://picsum.photos/seed/bedding/800/600', false, '919999900020', 4, '2026-06-30 19:11:10.955399+00');

select setval('inventory_id_seq', (select max(id) from inventory));
