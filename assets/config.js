// ==========================================================
// PASTE YOUR SUPABASE PROJECT DETAILS HERE
// Both values are SAFE to expose publicly — the "anon" key only
// allows what your RLS policies in schema-v2.sql permit.
// ==========================================================
const SUPABASE_URL = "https://yzwmkfuhtqvsvdhphosx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d21rZnVodHF2c3ZkaHBob3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTEyOTksImV4cCI6MjA5ODQ4NzI5OX0.SyN2AOPPLwN8_J-vY38-8IobqklXrn5dVtVqoxjPioM";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fallback values (used only until Settings loads from the database —
// real business name / tagline / default tab are edited in Admin > Settings)
const FALLBACK_BUSINESS_NAME = "One3 Stay";
const FALLBACK_TAGLINE = "Flats · Homestays · Hourly Stays · Land for Sale · Tiffin Service";
const FALLBACK_DEFAULT_TAB = "properties";

// The public base URL of your live site (used to build shareable links).
// Update this once you know your GitHub Pages URL.
const SITE_BASE_URL = "https://vaibhavagarwalcool.github.io/one3-Stay/";
