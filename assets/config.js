/* ===================== One3 Stay — shared config & helpers =====================
   EDIT THESE TWO LINES with your own Supabase project values
   (Project Settings -> API -> Project URL / anon public key).
   The anon key is SAFE to put here — it is meant to be public.
   Real protection comes from the Row Level Security policies in
   migration.sql, not from hiding this key.
*/
const SUPABASE_URL = "https://lqxepeolwteqnmdusqcs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxeGVwZW9sd3RlcW5tZHVzcWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYzOTUsImV4cCI6MjA5ODQ";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- small helpers ---------- */
function escapeHtml(str){
  if(str===null||str===undefined) return "";
  return String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function toDigits(num){ return String(num||"").replace(/[^0-9+]/g,""); }

function waLink(number, text){
  const n = toDigits(number).replace(/^\+/,"");
  return `https://wa.me/${n}${text ? "?text="+encodeURIComponent(text) : ""}`;
}
function telLink(number){ return `tel:${toDigits(number)}`; }

function splitList(str){
  if(!str) return [];
  return String(str).split(",").map(s=>s.trim()).filter(Boolean);
}

function youtubeEmbed(url){
  // returns a watch-friendly link (kept as plain link, not embedded, to stay zero-cost/simple)
  return url;
}

let toastTimer;
function toast(msg){
  let el = document.getElementById("toastEl");
  if(!el){
    el = document.createElement("div");
    el.id = "toastEl";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove("show"), 2200);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(e){
    // fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); document.body.removeChild(ta); return true; }
    catch(e2){ document.body.removeChild(ta); return false; }
  }
}

async function shareListing(kind, id, title){
  const url = `${location.origin}${location.pathname}?type=${kind}&id=${id}`;
  if(navigator.share){
    try{ await navigator.share({ title: title || "One3 Stay", url }); return; }
    catch(e){ /* user cancelled, fall through to copy */ }
  }
  const ok = await copyText(url);
  toast(ok ? "Link copied — paste it anywhere to share" : url);
}

function getSetting(settingsMap, key, fallback){
  return (settingsMap && settingsMap[key]) || fallback;
}

/* parse custom_details jsonb-ish array safely (already JSON from supabase-js) */
function parseDetails(details){
  if(!details) return [];
  if(Array.isArray(details)) return details;
  try{ return JSON.parse(details); }catch(e){ return []; }
}
