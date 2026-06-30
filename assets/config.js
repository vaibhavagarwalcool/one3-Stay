// ==========================================================
// PASTE YOUR SUPABASE PROJECT DETAILS HERE (see README.md Step 2)
// Both values are SAFE to expose publicly — the "anon" key only
// allows what your RLS policies in schema.sql permit.
// ==========================================================
const SUPABASE_URL = "https://lqxepeolwteqnmdusqcs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxeGVwZW9sd3RlcW5tZHVzcWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYzOTUsImV4cCI6MjA5ODQxMjM5NX0.tUMPjJdIJo4M5PTm_zjDGOhcNETwUv8D09VasT463MA";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Business name shown across the site
const BUSINESS_NAME = "One3 Stay";