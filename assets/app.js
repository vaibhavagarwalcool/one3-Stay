// ---------- helpers ----------
function waLink(number, text) {
  if (!number) return "#";
  const clean = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
function callLink(number) {
  if (!number) return "#";
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}
function firstPhoto(photos) {
  if (!photos) return "https://placehold.co/600x400?text=No+Photo";
  return photos.split(",")[0].trim();
}
function photoList(photos) {
  if (!photos) return [];
  return photos.split(",").map(s => s.trim()).filter(Boolean);
}
function videoList(videos) {
  if (!videos) return [];
  return videos.split(",").map(s => s.trim()).filter(Boolean);
}
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- property card ----------
function renderPropertyCard(p) {
  const photos = photoList(p.photos);
  const videos = videoList(p.videos);
  const customDetails = (p.custom_details || []).filter(d => d.visible !== false);

  const detailsHtml = customDetails.map(d =>
    `<div><span>${escapeHtml(d.key)}</span><strong>${escapeHtml(d.value)}</strong></div>`
  ).join("");

  const videoHtml = videos.length
    ? `<div class="video-link">🎥 ${videos.map((v, i) => `<a href="${v}" target="_blank" rel="noopener">Video ${i + 1}</a>`).join(" · ")}</div>`
    : "";

  const waText = `Hi, I'm interested in "${p.title}" (${p.area}) listed on your site. Is it still available?`;

  const roomsBtn = p.has_rooms
    ? `<button class="rooms-toggle" onclick="toggleRooms(${p.id}, this)">▾ View Rooms in this building</button>
       <div class="rooms-wrap" id="rooms-${p.id}"></div>`
    : "";

  return `
  <div class="card">
    <img class="thumb" src="${firstPhoto(p.photos)}" alt="${escapeHtml(p.title)}" loading="lazy"
         onclick='openGallery(${JSON.stringify(photos)})'>
    <div class="card-body">
      <span class="tag">${escapeHtml(p.type)}</span>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="muted">📍 ${escapeHtml(p.area)}</div>
      <div class="price">${escapeHtml(p.price || "Price on request")}</div>
      <div class="avail ${p.availability ? "yes" : "no"}">${p.availability ? "✅ Available" : "❌ Not available"}</div>
      ${videoHtml}
      <div class="details">${detailsHtml}</div>
      <div class="btn-row">
        <a class="btn call" href="${callLink(p.phone)}">📞 Call</a>
        <a class="btn wa" href="${waLink(p.whatsapp, waText)}" target="_blank">💬 WhatsApp</a>
        ${p.map_link ? `<a class="btn map" href="${p.map_link}" target="_blank">🗺️ Map</a>` : ""}
      </div>
      ${roomsBtn}
    </div>
  </div>`;
}

async function toggleRooms(propertyId, btn) {
  const wrap = document.getElementById(`rooms-${propertyId}`);
  const isOpen = wrap.classList.contains("open");
  if (isOpen) { wrap.classList.remove("open"); btn.textContent = "▾ View Rooms in this building"; return; }

  btn.textContent = "▴ Hide Rooms";
  wrap.classList.add("open");
  if (wrap.dataset.loaded) return;

  const { data, error } = await supabaseClient.from("rooms").select("*").eq("property_id", propertyId).order("id");
  if (error || !data || !data.length) { wrap.innerHTML = `<div class="muted">No rooms added yet.</div>`; return; }

  wrap.innerHTML = data.map(r => `
    <div class="room-mini">
      <img src="${firstPhoto(r.photos)}" onclick='openGallery(${JSON.stringify(photoList(r.photos))})'>
      <div class="room-info">
        <strong>${escapeHtml(r.title)}</strong> — ${escapeHtml(r.rent || "")}
        <div class="avail ${r.availability ? "yes" : "no"}">${r.availability ? "Available" : "Not available"}</div>
      </div>
      <a class="btn wa" style="flex:none" target="_blank" href="${waLink(p_global_whatsapp(propertyId), `Hi, I'm interested in ${r.title} — is it available?`)}">💬</a>
    </div>
  `).join("");
  wrap.dataset.loaded = "1";
}

// cache property whatsapp numbers so room buttons can use them
let __propCache = {};
function cacheProperty(p) { __propCache[p.id] = p; }
function p_global_whatsapp(id) { return __propCache[id] ? __propCache[id].whatsapp : ""; }

// ---------- tiffin card ----------
function renderTiffinCard(t) {
  const waText = `Hi, I'd like tiffin service details for ${t.area}.`;
  return `
  <div class="card">
    <div class="card-body">
      <span class="tag">Tiffin</span>
      <h3>${escapeHtml(t.area)}</h3>
      <div class="price">${escapeHtml(t.price || "")}</div>
      <div class="muted">${escapeHtml(t.menu || "")}</div>
      <div class="avail ${t.availability ? "yes" : "no"}">${t.availability ? "✅ Taking orders" : "❌ Currently full"}</div>
      <div class="btn-row">
        <a class="btn wa" href="${waLink(t.whatsapp, waText)}" target="_blank">💬 WhatsApp</a>
      </div>
    </div>
  </div>`;
}

// ---------- inventory card ----------
function renderInventoryCard(it) {
  const waText = `Hi, I'm interested in buying: ${it.item}`;
  return `
  <div class="card">
    <img class="thumb" src="${firstPhoto(it.photos)}" loading="lazy" onclick='openGallery(${JSON.stringify(photoList(it.photos))})'>
    <div class="card-body">
      <span class="tag">For Sale</span>
      <h3>${escapeHtml(it.item)}</h3>
      <div class="price">${escapeHtml(it.price || "")}</div>
      <div class="avail ${it.availability ? "yes" : "no"}">${it.availability ? "✅ Available" : "❌ Sold"}</div>
      <div class="btn-row">
        <a class="btn wa" href="${waLink(it.whatsapp, waText)}" target="_blank">💬 Inquire</a>
      </div>
    </div>
  </div>`;
}

// ---------- simple lightbox gallery ----------
function openGallery(photos) {
  if (!photos || !photos.length) return;
  let idx = 0;
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:999;display:flex;align-items:center;justify-content:center;flex-direction:column;";
  const img = document.createElement("img");
  img.style.cssText = "max-width:92%;max-height:78%;border-radius:8px;";
  img.src = photos[idx];
  const counter = document.createElement("div");
  counter.style.cssText = "color:#fff;margin-top:10px;font-size:.85rem";
  function update() { img.src = photos[idx]; counter.textContent = `${idx + 1} / ${photos.length}`; }
  update();
  const row = document.createElement("div");
  row.style.cssText = "display:flex;gap:20px;margin-top:14px;";
  const mk = (txt, fn) => { const b = document.createElement("button"); b.textContent = txt; b.style.cssText = "padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:1rem;"; b.onclick = fn; return b; };
  if (photos.length > 1) {
    row.appendChild(mk("‹ Prev", () => { idx = (idx - 1 + photos.length) % photos.length; update(); }));
  }
  row.appendChild(mk("✕ Close", () => document.body.removeChild(overlay)));
  if (photos.length > 1) {
    row.appendChild(mk("Next ›", () => { idx = (idx + 1) % photos.length; update(); }));
  }
  overlay.appendChild(img); overlay.appendChild(counter); overlay.appendChild(row);
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
  document.body.appendChild(overlay);
}
