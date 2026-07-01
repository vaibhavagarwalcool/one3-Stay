// =====================================================================
// AUTH
// =====================================================================
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) showAdmin(data.session); else showLogin();
}
function showLogin() {
  document.getElementById("loginScreen").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";
}
function showAdmin(session) {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  document.getElementById("loggedInAs").textContent = "Logged in as " + (session.user ? session.user.email : "");
  loadProperties(); loadTiffin(); loadInventory(); loadServices(); loadQuickContacts(); loadSettingsForm(); loadInquiries(); loadPropertyOptionsForRooms();
}
async function logout() { await supabaseClient.auth.signOut(); showLogin(); }

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email: f.email.value, password: f.password.value });
  document.getElementById("loginMsg").textContent = error ? "❌ " + error.message : "";
  if (!error) showAdmin(data.session);
});

async function loadBizName() {
  const { data } = await supabaseClient.from("settings").select("*").eq("key", "business_name").single();
  document.getElementById("bizNameAdmin").textContent = (data && data.value) || FALLBACK_BUSINESS_NAME;
}
loadBizName();

function showAdminTab(tab) {
  ["properties","rooms","tiffin","inventory","services","quick","settings","inquiries"].forEach(t => {
    document.getElementById("admin-" + t).style.display = (t === tab) ? "block" : "none";
  });
}

// =====================================================================
// PHOTO MANAGER — thumbnails with "set main" (moves to front) + remove
// underlying state is a plain array of URLs kept in a data attribute
// =====================================================================
function initPhotoManager(containerId, existingPhotos) {
  const state = photoList(existingPhotos);
  renderPhotoManager(containerId, state);
  return state; // caller keeps no reference; we store state on the DOM node instead
}
function renderPhotoManager(containerId, urls) {
  const el = document.getElementById(containerId);
  el.dataset.urls = JSON.stringify(urls);
  el.innerHTML = urls.map((u, i) => `
    <div class="photo-thumb ${i === 0 ? "is-main" : ""}">
      ${i === 0 ? '<span class="main-badge">MAIN</span>' : ""}
      <img src="${u}">
      <div class="thumb-actions">
        ${i !== 0 ? `<button type="button" onclick="setMainPhoto('${containerId}', ${i})" title="Set as main">★</button>` : ""}
        <button type="button" onclick="removePhoto('${containerId}', ${i})" title="Remove">✕</button>
      </div>
    </div>`).join("") || `<div class="muted" style="font-size:.78rem">No photos yet — upload below.</div>`;
}
function setMainPhoto(containerId, index) {
  const urls = JSON.parse(document.getElementById(containerId).dataset.urls);
  const [chosen] = urls.splice(index, 1);
  urls.unshift(chosen);
  renderPhotoManager(containerId, urls);
}
function removePhoto(containerId, index) {
  const urls = JSON.parse(document.getElementById(containerId).dataset.urls);
  urls.splice(index, 1);
  renderPhotoManager(containerId, urls);
}
function addPhotosToManager(containerId, newUrls) {
  const urls = JSON.parse(document.getElementById(containerId).dataset.urls);
  renderPhotoManager(containerId, urls.concat(newUrls));
}
function getPhotosFromManager(containerId) {
  return JSON.parse(document.getElementById(containerId).dataset.urls).join(",");
}

async function uploadPhotosToStorage(fileInput, statusEl) {
  const files = Array.from(fileInput.files || []);
  if (!files.length) return [];
  statusEl.textContent = `Uploading ${files.length} photo(s)...`;
  const urls = [];
  for (const file of files) {
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
    const { error } = await supabaseClient.storage.from("photos").upload(path, file);
    if (error) { statusEl.textContent = "❌ Upload failed: " + error.message; continue; }
    const { data } = supabaseClient.storage.from("photos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  statusEl.textContent = urls.length ? `✅ Uploaded ${urls.length} photo(s)` : "";
  return urls;
}
function wirePhotoUpload(uploadInputId, statusId, managerContainerId) {
  document.getElementById(uploadInputId).addEventListener("change", async (e) => {
    const urls = await uploadPhotosToStorage(e.target, document.getElementById(statusId));
    if (urls.length) addPhotosToManager(managerContainerId, urls);
    e.target.value = "";
  });
}

// =====================================================================
// CUSTOM DETAILS editor
// =====================================================================
function renderCustomDetailsEditor(containerId, existing) {
  const rows = (existing && existing.length) ? existing : [];
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  rows.forEach(r => addDetailRow(containerId, r.key, r.value, r.visible));
}
function addDetailRow(containerId, key = "", value = "", visible = true) {
  const container = document.getElementById(containerId);
  const row = document.createElement("div");
  row.className = "kv-row";
  row.innerHTML = `
    <input placeholder="Label e.g. Security" class="dk" value="${escapeHtml(key)}">
    <input placeholder="Value (long text OK, e.g. full description)" class="dv" value="${escapeHtml(value)}">
    <label style="display:flex;align-items:center;gap:3px;font-size:.72rem;white-space:nowrap"><input type="checkbox" class="dvis" ${visible ? "checked" : ""}> show</label>
    <button type="button" class="small-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(row);
}
function collectCustomDetails(containerId) {
  const rows = document.querySelectorAll(`#${containerId} .kv-row`);
  return Array.from(rows).map(r => ({
    key: r.querySelector(".dk").value.trim(),
    value: r.querySelector(".dv").value.trim(),
    visible: r.querySelector(".dvis").checked
  })).filter(r => r.key);
}

// =====================================================================
// BACKUP / EXPORT (full JSON dump of every table)
// =====================================================================
async function exportBackup() {
  const tables = ["properties", "rooms", "tiffin", "inventory", "services", "quick_contacts", "settings", "inquiries"];
  const backup = { exported_at: new Date().toISOString() };
  for (const t of tables) {
    const { data, error } = await supabaseClient.from(t).select("*");
    backup[t] = error ? { error: error.message } : data;
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// =====================================================================
// SETTINGS TAB
// =====================================================================
async function loadSettingsForm() {
  const { data } = await supabaseClient.from("settings").select("*");
  const map = {}; (data || []).forEach(r => map[r.key] = r.value);
  const el = document.getElementById("admin-settings");
  el.innerHTML = `
    <form class="panel" id="settingsForm">
      <h3>Site Settings</h3>
      <label>Business Name</label>
      <input name="business_name" value="${escapeHtml(map.business_name || "")}">
      <label>Tagline</label>
      <input name="tagline" value="${escapeHtml(map.tagline || "")}">
      <label>Default tab shown when the site loads</label>
      <select name="default_tab">
        ${["properties","tiffin","inventory","services","form"].map(t => `<option value="${t}" ${map.default_tab === t ? "selected" : ""}>${t}</option>`).join("")}
      </select>
      <button type="submit" class="btn primary">Save Settings</button>
      <div id="settingsMsg" class="muted" style="margin-top:8px"></div>
    </form>`;
  document.getElementById("settingsForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const rows = ["business_name", "tagline", "default_tab"].map(k => ({ key: k, value: f[k].value }));
    const { error } = await supabaseClient.from("settings").upsert(rows);
    document.getElementById("settingsMsg").textContent = error ? "Error: " + error.message : "✅ Saved";
    if (!error) loadBizName();
  });
}

// =====================================================================
// QUICK CONTACTS TAB
// =====================================================================
async function loadQuickContacts() {
  const { data, error } = await supabaseClient.from("quick_contacts").select("*").order("sort_order");
  const el = document.getElementById("admin-quick");
  let html = `<button class="btn primary" onclick="openQuickForm()">+ Add Quick Contact Role</button><div id="quickFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">None yet.</div>`;
  else html += data.map(c => `
    <div class="admin-list-item">
      <div>${c.icon || "💬"} <strong>${escapeHtml(c.role)}</strong><br><span class="muted">${escapeHtml(c.whatsapp || "")}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openQuickForm(${JSON.stringify(c).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick="deleteRecord('quick_contacts', ${c.id}, loadQuickContacts)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}
function openQuickForm(existing) {
  const wrap = document.getElementById("quickFormWrap");
  const e = existing || {};
  wrap.innerHTML = `
    <form class="panel" id="quickForm">
      <h3>${existing ? "Edit" : "Add"} Quick Contact</h3>
      <label>Role label (e.g. Broker, Tenant, Supplier)</label><input name="role" required value="${escapeHtml(e.role||"")}">
      <label>Icon (emoji)</label><input name="icon" value="${escapeHtml(e.icon||"💬")}">
      <label>Prefilled WhatsApp message</label><textarea name="message">${escapeHtml(e.message||"")}</textarea>
      <label>WhatsApp number (with country code)</label><input name="whatsapp" required value="${escapeHtml(e.whatsapp||"")}">
      <label>Sort Order</label><input name="sort_order" type="number" value="${e.sort_order ?? 0}">
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('quickFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  document.getElementById("quickForm").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const f = ev.target;
    const payload = { role: f.role.value, icon: f.icon.value, message: f.message.value, whatsapp: f.whatsapp.value.trim(), sort_order: parseInt(f.sort_order.value) || 0 };
    let res;
    if (existing && existing.id) res = await supabaseClient.from("quick_contacts").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("quick_contacts").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("quickFormWrap").innerHTML = "";
    loadQuickContacts();
  });
}

// =====================================================================
// SERVICES TAB
// =====================================================================
async function loadServices() {
  const { data, error } = await supabaseClient.from("services").select("*").order("pinned", { ascending: false }).order("sort_order");
  const el = document.getElementById("admin-services");
  let html = `<button class="btn primary" onclick="openServiceForm()">+ Add Service</button><div id="serviceFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">No services yet.</div>`;
  else html += data.map(s => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(s.item)}</strong> ${s.pinned ? '<span class="pinned-badge">PINNED</span>' : ""}<br><span class="muted">${escapeHtml(s.price||"")}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openServiceForm(${JSON.stringify(s).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick='openServiceForm(${JSON.stringify({...s, id: null, item: s.item + " (Copy)"}).replace(/'/g, "&#39;")})'>Duplicate</button>
        <button class="small-btn" onclick="deleteRecord('services', ${s.id}, loadServices)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}
function openServiceForm(existing) {
  const wrap = document.getElementById("serviceFormWrap");
  const e = existing || {};
  wrap.innerHTML = `
    <form class="panel" id="serviceForm">
      <h3>${existing && existing.id ? "Edit" : "Add"} Service</h3>
      <label>Service Name</label><input name="item" required value="${escapeHtml(e.item||"")}">
      <label>Description</label><textarea name="description">${escapeHtml(e.description||"")}</textarea>
      <label>Price (optional)</label><input name="price" value="${escapeHtml(e.price||"")}">
      <label>Phone</label><input name="phone" value="${escapeHtml(e.phone||"")}">
      <label>WhatsApp</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Available</label>
      <label><input type="checkbox" name="pinned" ${e.pinned?"checked":""}> Pin to top</label>
      <label>Sort Order</label><input name="sort_order" type="number" value="${e.sort_order ?? 0}">
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('serviceFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  document.getElementById("serviceForm").addEventListener("submit", async (ev) => {
    ev.preventDefault(); const f = ev.target;
    const payload = { item: f.item.value, description: f.description.value, price: f.price.value, phone: f.phone.value.trim(), whatsapp: f.whatsapp.value.trim(), availability: f.availability.checked, pinned: f.pinned.checked, sort_order: parseInt(f.sort_order.value) || 0 };
    let res;
    if (existing && existing.id) res = await supabaseClient.from("services").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("services").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("serviceFormWrap").innerHTML = "";
    loadServices();
  });
}

// =====================================================================
// PROPERTIES TAB
// =====================================================================
async function loadProperties() {
  const { data, error } = await supabaseClient.from("properties").select("*").order("pinned", { ascending: false }).order("sort_order").order("created_at", { ascending: false });
  const el = document.getElementById("admin-properties");
  let html = `<button class="btn primary" onclick="openPropertyForm()">+ Add New Property</button><div id="propFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error loading properties.</div>`;
  else if (!data.length) html += `<div class="empty">No properties yet.</div>`;
  else html += data.map(p => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(p.title)}</strong> ${p.pinned ? '<span class="pinned-badge">PINNED</span>' : ""}<br><span class="muted">${escapeHtml(p.area)} · ${escapeHtml(p.type)} · ${p.availability ? "Available" : "Unavailable"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openDetailModal("property", ${p.id})'>Preview</button>
        <button class="small-btn" onclick='openPropertyForm(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick='openPropertyForm(${JSON.stringify({...p, id: null, title: p.title + " (Copy)"}).replace(/'/g, "&#39;")})'>Duplicate</button>
        <button class="small-btn" onclick="deleteRecord('properties', ${p.id}, loadProperties)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}

function openPropertyForm(existing) {
  const wrap = document.getElementById("propFormWrap");
  const e = existing || {};
  const isEdit = existing && existing.id;
  wrap.innerHTML = `
    <form class="panel" id="propertyForm">
      <h3>${isEdit ? "Edit" : "Add"} Property</h3>
      <label>Title</label><input name="title" required value="${escapeHtml(e.title||"")}">
      <label>Area</label><input name="area" required value="${escapeHtml(e.area||"")}">
      <label>Type</label>
      <select name="type">
        ${["flat","homestay","hourly","land"].map(t => `<option value="${t}" ${e.type===t?"selected":""}>${t}</option>`).join("")}
      </select>
      <label>Price</label><input name="price" value="${escapeHtml(e.price||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Available</label>
      <label><input type="checkbox" name="has_rooms" ${e.has_rooms?"checked":""}> This property has multiple rooms (manage in Rooms tab)</label>
      <label><input type="checkbox" name="pinned" ${e.pinned?"checked":""}> ⭐ Pin as Featured (shows first)</label>
      <label>Sort Order (lower number = shown earlier)</label><input name="sort_order" type="number" value="${e.sort_order ?? 0}">

      <label>Photos</label>
      <div class="photo-manager" id="propPhotoManager"></div>
      <input type="file" id="propPhotoUpload" multiple accept="image/*">
      <div class="upload-status" id="propUploadStatus">First photo shown = main/cover photo. Click ★ on any photo to make it the main one.</div>

      <label>Videos (comma-separated YouTube/Drive links)</label>
      <textarea name="videos">${escapeHtml(e.videos||"")}</textarea>
      <label>Google Maps Link</label><input name="map_link" value="${escapeHtml(e.map_link||"")}">
      <label>Phone</label><input name="phone" value="${escapeHtml(e.phone||"")}">
      <label>WhatsApp (with country code, no +)</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label>Custom Details (add as many as you like — long text like a full description works fine)</label>
      <div id="propCustomDetails"></div>
      <button type="button" class="small-btn" onclick="addDetailRow('propCustomDetails')">+ Add Detail Row</button>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('propFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  renderCustomDetailsEditor("propCustomDetails", e.custom_details);
  initPhotoManager("propPhotoManager", e.photos);
  wirePhotoUpload("propPhotoUpload", "propUploadStatus", "propPhotoManager");

  document.getElementById("propertyForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const payload = {
      title: f.title.value, area: f.area.value, type: f.type.value, price: f.price.value,
      availability: f.availability.checked, has_rooms: f.has_rooms.checked,
      pinned: f.pinned.checked, sort_order: parseInt(f.sort_order.value) || 0,
      photos: getPhotosFromManager("propPhotoManager"), videos: f.videos.value.trim(),
      map_link: f.map_link.value.trim(), phone: f.phone.value.trim(), whatsapp: f.whatsapp.value.trim(),
      custom_details: collectCustomDetails("propCustomDetails")
    };
    let res;
    if (isEdit) res = await supabaseClient.from("properties").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("properties").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("propFormWrap").innerHTML = "";
    loadProperties(); loadPropertyOptionsForRooms();
  });
}

// =====================================================================
// ROOMS TAB
// =====================================================================
async function loadPropertyOptionsForRooms() {
  const { data } = await supabaseClient.from("properties").select("id,title").eq("has_rooms", true).order("title");
  const el = document.getElementById("admin-rooms");
  const options = (data || []).map(p => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join("");
  el.innerHTML = `
    <label style="font-weight:700">Select Property (multi-room buildings only)</label>
    <select id="roomPropertySelect" onchange="loadRooms()" style="padding:10px;border-radius:10px;border:1px solid #ddd;margin-bottom:12px;width:100%;max-width:400px">
      <option value="">-- choose --</option>${options}
    </select>
    <div id="roomsListWrap"></div>`;
  if (!data || !data.length) el.innerHTML += `<div class="empty">No multi-room properties yet. Tick "has multiple rooms" on a property first.</div>`;
}

async function loadRooms() {
  const propertyId = document.getElementById("roomPropertySelect").value;
  const wrap = document.getElementById("roomsListWrap");
  if (!propertyId) { wrap.innerHTML = ""; return; }
  const { data, error } = await supabaseClient.from("rooms").select("*").eq("property_id", propertyId).order("pinned", { ascending: false }).order("sort_order");
  let html = `<button class="btn primary" onclick="openRoomForm(${propertyId})">+ Add Room</button><div id="roomFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">No rooms added yet.</div>`;
  else html += data.map(r => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(r.title)}</strong> ${r.pinned ? '<span class="pinned-badge">PINNED</span>' : ""}<br><span class="muted">${escapeHtml(r.rent||"")} · ${r.availability?"Available":"Unavailable"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openRoomForm(${propertyId}, ${JSON.stringify(r).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick='openRoomForm(${propertyId}, ${JSON.stringify({...r, id: null, title: r.title + " (Copy)"}).replace(/'/g, "&#39;")})'>Duplicate</button>
        <button class="small-btn" onclick="deleteRecord('rooms', ${r.id}, loadRooms)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  wrap.innerHTML = html;
}

function openRoomForm(propertyId, existing) {
  const wrap = document.getElementById("roomFormWrap");
  const e = existing || {};
  const isEdit = existing && existing.id;
  wrap.innerHTML = `
    <form class="panel" id="roomForm">
      <h3>${isEdit ? "Edit" : "Add"} Room</h3>
      <label>Room Title</label><input name="title" required value="${escapeHtml(e.title||"")}">
      <label>Rent</label><input name="rent" value="${escapeHtml(e.rent||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Available</label>
      <label><input type="checkbox" name="pinned" ${e.pinned?"checked":""}> Pin to top</label>
      <label>Sort Order</label><input name="sort_order" type="number" value="${e.sort_order ?? 0}">
      <label>Photos</label>
      <div class="photo-manager" id="roomPhotoManager"></div>
      <input type="file" id="roomPhotoUpload" multiple accept="image/*">
      <div class="upload-status" id="roomUploadStatus">First photo = main photo.</div>
      <label>Videos (comma-separated links)</label>
      <textarea name="videos">${escapeHtml(e.videos||"")}</textarea>
      <label>Phone (optional — leave blank to use the property's phone)</label><input name="phone" value="${escapeHtml(e.phone||"")}">
      <label>WhatsApp (optional — leave blank to use the property's WhatsApp)</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label>Custom Details</label>
      <div id="roomCustomDetails"></div>
      <button type="button" class="small-btn" onclick="addDetailRow('roomCustomDetails')">+ Add Detail Row</button>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('roomFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  renderCustomDetailsEditor("roomCustomDetails", e.custom_details);
  initPhotoManager("roomPhotoManager", e.photos);
  wirePhotoUpload("roomPhotoUpload", "roomUploadStatus", "roomPhotoManager");

  document.getElementById("roomForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const payload = {
      property_id: propertyId, title: f.title.value, rent: f.rent.value, availability: f.availability.checked,
      pinned: f.pinned.checked, sort_order: parseInt(f.sort_order.value) || 0,
      photos: getPhotosFromManager("roomPhotoManager"), videos: f.videos.value.trim(),
      phone: f.phone.value.trim(), whatsapp: f.whatsapp.value.trim(),
      custom_details: collectCustomDetails("roomCustomDetails")
    };
    let res;
    if (isEdit) res = await supabaseClient.from("rooms").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("rooms").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("roomFormWrap").innerHTML = "";
    loadRooms();
  });
}

// =====================================================================
// TIFFIN TAB
// =====================================================================
async function loadTiffin() {
  const { data, error } = await supabaseClient.from("tiffin").select("*").order("pinned", { ascending: false }).order("sort_order");
  const el = document.getElementById("admin-tiffin");
  let html = `<button class="btn primary" onclick="openTiffinForm()">+ Add Tiffin Area</button><div id="tiffinFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">No tiffin areas yet.</div>`;
  else html += data.map(t => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(t.area)}</strong> ${t.pinned ? '<span class="pinned-badge">PINNED</span>' : ""}<br><span class="muted">${escapeHtml(t.price||"")} · ${t.availability?"Taking orders":"Full"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openTiffinForm(${JSON.stringify(t).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick='openTiffinForm(${JSON.stringify({...t, id: null, area: t.area + " (Copy)"}).replace(/'/g, "&#39;")})'>Duplicate</button>
        <button class="small-btn" onclick="deleteRecord('tiffin', ${t.id}, loadTiffin)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}
function openTiffinForm(existing) {
  const wrap = document.getElementById("tiffinFormWrap");
  const e = existing || {};
  const isEdit = existing && existing.id;
  wrap.innerHTML = `
    <form class="panel" id="tiffinForm">
      <h3>${isEdit ? "Edit" : "Add"} Tiffin Area</h3>
      <label>Area</label><input name="area" required value="${escapeHtml(e.area||"")}">
      <label>Price</label><input name="price" value="${escapeHtml(e.price||"")}">
      <label>Menu / Notes</label><textarea name="menu">${escapeHtml(e.menu||"")}</textarea>
      <label>Photos</label>
      <div class="photo-manager" id="tiffinPhotoManager"></div>
      <input type="file" id="tiffinPhotoUpload" multiple accept="image/*">
      <div class="upload-status" id="tiffinUploadStatus"></div>
      <label>Phone</label><input name="phone" value="${escapeHtml(e.phone||"")}">
      <label>WhatsApp (with country code, no +)</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Taking new orders</label>
      <label><input type="checkbox" name="pinned" ${e.pinned?"checked":""}> Pin to top</label>
      <label>Sort Order</label><input name="sort_order" type="number" value="${e.sort_order ?? 0}">
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('tiffinFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  initPhotoManager("tiffinPhotoManager", e.photos);
  wirePhotoUpload("tiffinPhotoUpload", "tiffinUploadStatus", "tiffinPhotoManager");
  document.getElementById("tiffinForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const payload = { area: f.area.value, price: f.price.value, menu: f.menu.value, phone: f.phone.value.trim(), whatsapp: f.whatsapp.value.trim(), availability: f.availability.checked, pinned: f.pinned.checked, sort_order: parseInt(f.sort_order.value) || 0, photos: getPhotosFromManager("tiffinPhotoManager") };
    let res;
    if (isEdit) res = await supabaseClient.from("tiffin").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("tiffin").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("tiffinFormWrap").innerHTML = "";
    loadTiffin();
  });
}

// =====================================================================
// INVENTORY TAB
// =====================================================================
async function loadInventory() {
  const { data, error } = await supabaseClient.from("inventory").select("*").order("pinned", { ascending: false }).order("sort_order");
  const el = document.getElementById("admin-inventory");
  let html = `<button class="btn primary" onclick="openInventoryForm()">+ Add Item</button><div id="invFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">No items yet.</div>`;
  else html += data.map(i => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(i.item)}</strong> ${i.pinned ? '<span class="pinned-badge">PINNED</span>' : ""}<br><span class="muted">${escapeHtml(i.price||"")} · ${i.availability?"Available":"Sold"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openInventoryForm(${JSON.stringify(i).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick='openInventoryForm(${JSON.stringify({...i, id: null, item: i.item + " (Copy)"}).replace(/'/g, "&#39;")})'>Duplicate</button>
        <button class="small-btn" onclick="deleteRecord('inventory', ${i.id}, loadInventory)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}
function openInventoryForm(existing) {
  const wrap = document.getElementById("invFormWrap");
  const e = existing || {};
  const isEdit = existing && existing.id;
  wrap.innerHTML = `
    <form class="panel" id="invForm">
      <h3>${isEdit ? "Edit" : "Add"} Item</h3>
      <label>Item Name</label><input name="item" required value="${escapeHtml(e.item||"")}">
      <label>Price</label><input name="price" value="${escapeHtml(e.price||"")}">
      <label>Photos</label>
      <div class="photo-manager" id="invPhotoManager"></div>
      <input type="file" id="invPhotoUpload" multiple accept="image/*">
      <div class="upload-status" id="invUploadStatus"></div>
      <label>Phone</label><input name="phone" value="${escapeHtml(e.phone||"")}">
      <label>WhatsApp (with country code, no +)</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Available</label>
      <label><input type="checkbox" name="pinned" ${e.pinned?"checked":""}> Pin to top</label>
      <label>Sort Order</label><input name="sort_order" type="number" value="${e.sort_order ?? 0}">
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('invFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  initPhotoManager("invPhotoManager", e.photos);
  wirePhotoUpload("invPhotoUpload", "invUploadStatus", "invPhotoManager");
  document.getElementById("invForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const payload = { item: f.item.value, price: f.price.value, phone: f.phone.value.trim(), whatsapp: f.whatsapp.value.trim(), availability: f.availability.checked, pinned: f.pinned.checked, sort_order: parseInt(f.sort_order.value) || 0, photos: getPhotosFromManager("invPhotoManager") };
    let res;
    if (isEdit) res = await supabaseClient.from("inventory").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("inventory").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("invFormWrap").innerHTML = "";
    loadInventory();
  });
}

// =====================================================================
// INQUIRIES (read-only + delete)
// =====================================================================
async function loadInquiries() {
  const { data, error } = await supabaseClient.from("inquiries").select("*").order("created_at", { ascending: false });
  const el = document.getElementById("admin-inquiries");
  if (error) { el.innerHTML = `<div class="empty">Error loading inquiries.</div>`; return; }
  if (!data.length) { el.innerHTML = `<div class="empty">No inquiries yet.</div>`; return; }
  el.innerHTML = data.map(i => `
    <div class="admin-list-item">
      <div>
        <strong>${escapeHtml(i.name)}</strong> (${escapeHtml(i.phone)}) — <span class="tag">${escapeHtml(i.type)}</span><br>
        <span class="muted">${escapeHtml(i.message)}</span><br>
        <span class="muted">${new Date(i.created_at).toLocaleString()}</span>
      </div>
      <div class="actions">
        <a class="small-btn" target="_blank" href="${waLink(i.phone, 'Hi ' + i.name + ', regarding your inquiry...')}">WhatsApp</a>
        <button class="small-btn" onclick="deleteRecord('inquiries', ${i.id}, loadInquiries)">Delete</button>
      </div>
    </div>`).join("");
}

// =====================================================================
// SHARED DELETE
// =====================================================================
async function deleteRecord(table, id, reload) {
  if (!confirm("Delete this record?")) return;
  const { error } = await supabaseClient.from(table).delete().eq("id", id);
  if (error) { alert("Error: " + error.message); return; }
  reload();
}

checkSession();
