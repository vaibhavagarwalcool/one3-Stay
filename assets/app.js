// =====================================================================
// HELPERS
// =====================================================================
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
  return photoList(photos)[0] || "https://placehold.co/600x400?text=No+Photo";
}
function photoList(photos) {
  if (!photos) return [];
  return photos.split(",").map(s => s.trim()).filter(Boolean);
}
function videoList(videos) {
  if (!videos) return [];
  return videos.split(",").map(s => s.trim()).filter(Boolean);
}
function jsAttr(val) {
  // Safe to embed inside a single-quoted onclick='...' attribute
  return JSON.stringify(val).replace(/'/g, "&#39;");
}
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return Math.max(1, Math.floor(diff / 60)) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  const days = Math.floor(diff / 86400);
  if (days < 30) return days + "d ago";
  return new Date(dateStr).toLocaleDateString();
}
function shareUrl(type, id) {
  const base = (typeof SITE_BASE_URL !== "undefined" ? SITE_BASE_URL : location.origin + location.pathname.replace(/[^/]*$/, ""));
  return `${base}?type=${type}&id=${id}`;
}
async function shareItem(type, id, title, btnEl) {
  const url = shareUrl(type, id);
  const text = `Check this out: ${title}`;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { /* user cancelled */ return; }
  }
  try {
    await navigator.clipboard.writeText(url);
    const old = btnEl ? btnEl.textContent : "";
    if (btnEl) { btnEl.textContent = "✅ Copied"; setTimeout(() => btnEl.textContent = old, 1500); }
    else alert("Link copied:\n" + url);
  } catch (e) {
    prompt("Copy this link:", url);
  }
}

// =====================================================================
// CUSTOM DETAILS rendering (handles long text properly)
// =====================================================================
function renderDetailBlocks(customDetails) {
  const rows = (customDetails || []).filter(d => d.visible !== false && d.key);
  return rows.map(d => {
    const long = (d.value || "").length > 50 || (d.value || "").includes("\n");
    if (long) {
      return `<div class="detail-block"><div class="k">${escapeHtml(d.key)}</div><div class="v">${escapeHtml(d.value)}</div></div>`;
    }
    return `<div class="detail-row"><div class="k">${escapeHtml(d.key)}</div><div class="v">${escapeHtml(d.value)}</div></div>`;
  }).join("");
}
function previewDetails(customDetails, max = 3) {
  const rows = (customDetails || []).filter(d => d.visible !== false && d.key && (d.value || "").length <= 30);
  return rows.slice(0, max).map(d => `<span>${escapeHtml(d.key)}: ${escapeHtml(d.value)}</span>`).join("");
}

// =====================================================================
// PROPERTY CARD
// =====================================================================
let __propCache = {};
function cacheProperty(p) { __propCache[p.id] = p; }

function renderPropertyCard(p) {
  const photos = photoList(p.photos);
  const waText = `Hi, I'm interested in "${p.title}" (${p.area}) listed on your site. Is it still available?`;
  const ribbon = p.pinned ? `<div class="ribbon">⭐ Featured</div>` : "";
  const photoCount = photos.length > 1 ? `<div class="photo-count">📷 ${photos.length}</div>` : "";
  const roomsBtn = p.has_rooms
    ? `<button class="rooms-btn" onclick='event.stopPropagation();openRoomsModal(${p.id}, ${jsAttr(p.title)})'>🚪 View Rooms in this Building</button>`
    : "";

  return `
  <div class="card">
    <div class="thumb-wrap" onclick='openDetailModal("property", ${p.id})'>
      ${ribbon}${photoCount}
      <img class="thumb" src="${firstPhoto(p.photos)}" alt="${escapeHtml(p.title)}" loading="lazy">
    </div>
    <div class="card-body" onclick='openDetailModal("property", ${p.id})'>
      <span class="tag">${escapeHtml(p.type)}</span>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="muted">📍 ${escapeHtml(p.area)}</div>
      <div class="price">${escapeHtml(p.price || "Price on request")}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="avail ${p.availability ? "yes" : "no"}">${p.availability ? "✅ Available" : "❌ Unavailable"}</span>
        <span class="posted">${timeAgo(p.created_at)}</span>
      </div>
      <div class="preview-details">${previewDetails(p.custom_details)}</div>
    </div>
    ${roomsBtn}
    <div class="btn-row">
      <a class="btn call" href="${callLink(p.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(p.whatsapp, waText)}" target="_blank">💬 WhatsApp</a>
      ${p.map_link ? `<a class="btn map" href="${p.map_link}" target="_blank">🗺️ Map</a>` : ""}
      <button class="btn share" onclick='shareItem("property", ${p.id}, ${jsAttr(p.title)}, this)'>🔗 Share</button>
    </div>
  </div>`;
}

// =====================================================================
// ROOM MINI CARD (inside rooms modal)
// =====================================================================
function renderRoomCard(r, parentWhatsapp, parentPhone) {
  const waText = `Hi, I'm interested in ${r.title} — is it available?`;
  const miniDetails = (r.custom_details || []).filter(d => d.visible !== false && d.key).slice(0, 3)
    .map(d => `<div style="font-size:.72rem;color:var(--muted);display:flex;justify-content:space-between;gap:4px"><span>${escapeHtml(d.key)}</span><strong>${escapeHtml(d.value)}</strong></div>`).join("");
  return `
  <div class="room-card">
    <img src="${firstPhoto(r.photos)}" onclick='openDetailModal("room", ${r.id})'>
    <div class="rc-body" onclick='openDetailModal("room", ${r.id})'>
      <strong>${escapeHtml(r.title)}</strong><br>
      <span class="price">${escapeHtml(r.rent || "")}</span><br>
      <span class="avail ${r.availability ? "yes" : "no"}" style="margin-top:4px">${r.availability ? "Available" : "Unavailable"}</span>
      ${miniDetails}
    </div>
    <div class="btn-row">
      <a class="btn call" href="${callLink(parentPhone)}">📞</a>
      <a class="btn wa" target="_blank" href="${waLink(parentWhatsapp, waText)}">💬</a>
      <button class="btn share" onclick='shareItem("room", ${r.id}, ${jsAttr(r.title)}, this)'>🔗</button>
    </div>
  </div>`;
}

async function openRoomsModal(propertyId, propertyTitle) {
  const { data, error } = await supabaseClient.from("rooms").select("*").eq("property_id", propertyId).order("pinned", { ascending: false }).order("sort_order").order("id");
  const parent = __propCache[propertyId] || {};
  const body = (error || !data || !data.length)
    ? `<div class="empty">No rooms added yet.</div>`
    : `<div class="rooms-grid">${data.map(r => renderRoomCard(r, r.whatsapp || parent.whatsapp, r.phone || parent.phone)).join("")}</div>`;
  showModal(`🚪 Rooms in ${escapeHtml(propertyTitle)}`, body);
}

// =====================================================================
// TIFFIN CARD
// =====================================================================
function renderTiffinCard(t) {
  const waText = `Hi, I'd like tiffin service details for ${t.area}.`;
  const photos = photoList(t.photos);
  const img = photos.length ? `<div class="thumb-wrap" onclick='openGallery(${JSON.stringify(photos)})'><img class="thumb" src="${firstPhoto(t.photos)}" loading="lazy"></div>` : "";
  return `
  <div class="card">
    ${img}
    <div class="card-body">
      <span class="tag">Tiffin</span>
      <h3>${escapeHtml(t.area)}</h3>
      <div class="price">${escapeHtml(t.price || "")}</div>
      <div class="muted">${escapeHtml(t.menu || "")}</div>
      <span class="avail ${t.availability ? "yes" : "no"}">${t.availability ? "✅ Taking orders" : "❌ Currently full"}</span>
    </div>
    <div class="btn-row">
      <a class="btn call" href="${callLink(t.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(t.whatsapp, waText)}" target="_blank">💬 WhatsApp</a>
      <button class="btn share" onclick='shareItem("tiffin", ${t.id}, ${jsAttr("Tiffin service - " + t.area)}, this)'>🔗 Share</button>
    </div>
  </div>`;
}

// =====================================================================
// INVENTORY CARD
// =====================================================================
function renderInventoryCard(it) {
  const waText = `Hi, I'm interested in buying: ${it.item}`;
  return `
  <div class="card">
    <div class="thumb-wrap" onclick='openGallery(${JSON.stringify(photoList(it.photos))})'>
      <img class="thumb" src="${firstPhoto(it.photos)}" loading="lazy">
    </div>
    <div class="card-body">
      <span class="tag">For Sale</span>
      <h3>${escapeHtml(it.item)}</h3>
      <div class="price">${escapeHtml(it.price || "")}</div>
      <span class="avail ${it.availability ? "yes" : "no"}">${it.availability ? "✅ Available" : "❌ Sold"}</span>
    </div>
    <div class="btn-row">
      <a class="btn call" href="${callLink(it.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(it.whatsapp, waText)}" target="_blank">💬 Inquire</a>
      <button class="btn share" onclick='shareItem("inventory", ${it.id}, ${jsAttr(it.item)}, this)'>🔗 Share</button>
    </div>
  </div>`;
}

// =====================================================================
// SERVICE CARD
// =====================================================================
function renderServiceCard(s) {
  const waText = `Hi, I'm interested in your "${s.item}" service. Please share details.`;
  return `
  <div class="service-card">
    <span class="tag">Service</span>
    <h3 style="margin-top:6px">${escapeHtml(s.item)}</h3>
    <p>${escapeHtml(s.description || "")}</p>
    ${s.price ? `<div class="price" style="margin-bottom:8px">${escapeHtml(s.price)}</div>` : ""}
    <div class="btn-row" style="padding:0">
      <a class="btn call" href="${callLink(s.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(s.whatsapp, waText)}" target="_blank">💬 Inquire</a>
      <button class="btn share" onclick='shareItem("service", ${s.id}, ${jsAttr(s.item)}, this)'>🔗</button>
    </div>
  </div>`;
}

// =====================================================================
// GENERIC MODAL (bottom sheet)
// =====================================================================
function showModal(titleHtml, bodyHtml) {
  closeModal();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "activeModal";
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2>${titleHtml}</h2>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-content">${bodyHtml}</div>
    </div>`;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
}
function closeModal() {
  const m = document.getElementById("activeModal");
  if (m) m.remove();
  document.body.style.overflow = "";
}

// =====================================================================
// DETAIL MODAL — fetches a single record (used by cards AND by shared links)
// =====================================================================
async function openDetailModal(type, id) {
  const tableMap = { property: "properties", room: "rooms", tiffin: "tiffin", inventory: "inventory", service: "services" };
  const table = tableMap[type];
  if (!table) return;
  const { data, error } = await supabaseClient.from(table).select("*").eq("id", id).single();
  if (error || !data) { showModal("Not found", `<div class="empty">This listing may have been removed.</div>`); return; }

  if (type === "property") return renderPropertyDetail(data);
  if (type === "room") return renderRoomDetail(data);
  if (type === "tiffin") return renderTiffinDetail(data);
  if (type === "inventory") return renderInventoryDetail(data);
  if (type === "service") return renderServiceDetail(data);
}

function galleryHtml(photos) {
  if (!photos.length) return "";
  return `<div class="modal-gallery">${photos.map(p => `<img src="${p}" onclick='openGallery(${JSON.stringify(photos)})'>`).join("")}</div>`;
}
function videosHtml(videos) {
  if (!videos.length) return "";
  return `<div class="video-block">${videos.map((v, i) => `<a href="${v}" target="_blank" rel="noopener">🎥 Video ${i + 1}</a>`).join("")}</div>`;
}

function renderPropertyDetail(p) {
  cacheProperty(p);
  const photos = photoList(p.photos), videos = videoList(p.videos);
  const waText = `Hi, I'm interested in "${p.title}" (${p.area}) listed on your site. Is it still available?`;
  const roomsBtn = p.has_rooms ? `<button class="rooms-btn" onclick='openRoomsModal(${p.id}, ${jsAttr(p.title)})'>🚪 View Rooms in this Building</button>` : "";
  const body = `
    ${galleryHtml(photos)}
    <span class="tag">${escapeHtml(p.type)}</span>
    <div class="price" style="margin:8px 0 4px">${escapeHtml(p.price || "Price on request")}</div>
    <div class="muted">📍 ${escapeHtml(p.area)}</div>
    <span class="avail ${p.availability ? "yes" : "no"}" style="margin-top:6px">${p.availability ? "✅ Available" : "❌ Unavailable"}</span>
    ${videosHtml(videos)}
    ${renderDetailBlocks(p.custom_details)}
    ${roomsBtn}
    <div class="btn-row" style="padding:14px 0 0">
      <a class="btn call" href="${callLink(p.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(p.whatsapp, waText)}" target="_blank">💬 WhatsApp</a>
      ${p.map_link ? `<a class="btn map" href="${p.map_link}" target="_blank">🗺️ Map</a>` : ""}
      <button class="btn share" onclick='shareItem("property", ${p.id}, ${jsAttr(p.title)}, this)'>🔗 Share</button>
    </div>`;
  showModal(escapeHtml(p.title), body);
}

async function renderRoomDetail(r) {
  const photos = photoList(r.photos), videos = videoList(r.videos);
  const waText = `Hi, I'm interested in ${r.title} — is it available?`;
  let phone = r.phone, whatsapp = r.whatsapp;
  if (!phone || !whatsapp) {
    const { data: parent } = await supabaseClient.from("properties").select("phone,whatsapp,title").eq("id", r.property_id).single();
    if (parent) { phone = phone || parent.phone; whatsapp = whatsapp || parent.whatsapp; }
  }
  const body = `
    ${galleryHtml(photos)}
    <div class="price" style="margin:8px 0 4px">${escapeHtml(r.rent || "")}</div>
    <span class="avail ${r.availability ? "yes" : "no"}">${r.availability ? "✅ Available" : "❌ Unavailable"}</span>
    ${videosHtml(videos)}
    ${renderDetailBlocks(r.custom_details)}
    <div class="btn-row" style="padding:14px 0 0">
      <a class="btn call" href="${callLink(phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(whatsapp || "", waText)}" target="_blank">💬 WhatsApp</a>
      <button class="btn share" onclick='shareItem("room", ${r.id}, ${jsAttr(r.title)}, this)'>🔗 Share</button>
    </div>`;
  showModal(escapeHtml(r.title), body);
}

function renderTiffinDetail(t) {
  const photos = photoList(t.photos);
  const waText = `Hi, I'd like tiffin service details for ${t.area}.`;
  const body = `
    ${galleryHtml(photos)}
    <div class="price" style="margin:8px 0 4px">${escapeHtml(t.price || "")}</div>
    <div class="detail-block"><div class="k">Menu</div><div class="v">${escapeHtml(t.menu || "")}</div></div>
    <span class="avail ${t.availability ? "yes" : "no"}" style="margin-top:8px">${t.availability ? "✅ Taking orders" : "❌ Currently full"}</span>
    <div class="btn-row" style="padding:14px 0 0">
      <a class="btn call" href="${callLink(t.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(t.whatsapp, waText)}" target="_blank">💬 WhatsApp</a>
      <button class="btn share" onclick='shareItem("tiffin", ${t.id}, ${jsAttr("Tiffin service - " + t.area)}, this)'>🔗 Share</button>
    </div>`;
  showModal("🍱 " + escapeHtml(t.area), body);
}

function renderInventoryDetail(it) {
  const photos = photoList(it.photos);
  const waText = `Hi, I'm interested in buying: ${it.item}`;
  const body = `
    ${galleryHtml(photos)}
    <div class="price" style="margin:8px 0 4px">${escapeHtml(it.price || "")}</div>
    <span class="avail ${it.availability ? "yes" : "no"}">${it.availability ? "✅ Available" : "❌ Sold"}</span>
    <div class="btn-row" style="padding:14px 0 0">
      <a class="btn call" href="${callLink(it.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(it.whatsapp, waText)}" target="_blank">💬 Inquire</a>
      <button class="btn share" onclick='shareItem("inventory", ${it.id}, ${jsAttr(it.item)}, this)'>🔗 Share</button>
    </div>`;
  showModal(escapeHtml(it.item), body);
}

function renderServiceDetail(s) {
  const waText = `Hi, I'm interested in your "${s.item}" service. Please share details.`;
  const body = `
    ${s.price ? `<div class="price" style="margin:8px 0 4px">${escapeHtml(s.price)}</div>` : ""}
    <div class="detail-block"><div class="k">Details</div><div class="v">${escapeHtml(s.description || "")}</div></div>
    <div class="btn-row" style="padding:14px 0 0">
      <a class="btn call" href="${callLink(s.phone)}">📞 Call</a>
      <a class="btn wa" href="${waLink(s.whatsapp, waText)}" target="_blank">💬 Inquire</a>
      <button class="btn share" onclick='shareItem("service", ${s.id}, ${jsAttr(s.item)}, this)'>🔗 Share</button>
    </div>`;
  showModal(escapeHtml(s.item), body);
}

// =====================================================================
// LIGHTBOX (full-screen photo viewer)
// =====================================================================
function openGallery(photos) {
  if (!photos || !photos.length) return;
  let idx = 0;
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  const img = document.createElement("img");
  img.src = photos[idx];
  const counter = document.createElement("div");
  counter.className = "lightbox-counter";
  function update() { img.src = photos[idx]; counter.textContent = `${idx + 1} / ${photos.length}`; }
  update();
  const row = document.createElement("div");
  row.className = "lightbox-row";
  const mk = (txt, fn, bg) => { const b = document.createElement("button"); b.textContent = txt; b.style.background = bg || "#fff"; b.onclick = fn; return b; };
  if (photos.length > 1) row.appendChild(mk("‹ Prev", () => { idx = (idx - 1 + photos.length) % photos.length; update(); }));
  row.appendChild(mk("✕ Close", () => document.body.removeChild(overlay), "#eee"));
  if (photos.length > 1) row.appendChild(mk("Next ›", () => { idx = (idx + 1) % photos.length; update(); }));
  overlay.appendChild(img); overlay.appendChild(counter); overlay.appendChild(row);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}

// =====================================================================
// DEEP LINK HANDLING — opens the right detail modal if URL has ?type=&id=
// =====================================================================
function handleDeepLink() {
  const params = new URLSearchParams(location.search);
  const type = params.get("type"), id = params.get("id");
  if (type && id) openDetailModal(type, id);
}
