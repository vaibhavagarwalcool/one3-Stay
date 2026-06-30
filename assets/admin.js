document.getElementById("bizNameAdmin").textContent = BUSINESS_NAME;

// ---------------- AUTH ----------------
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) showAdmin(); else showLogin();
}
function showLogin() {
  document.getElementById("loginScreen").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";
}
function showAdmin() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  loadProperties(); loadTiffin(); loadInventory(); loadInquiries(); loadPropertyOptionsForRooms();
}
async function logout() { await supabaseClient.auth.signOut(); showLogin(); }

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const { error } = await supabaseClient.auth.signInWithPassword({ email: f.email.value, password: f.password.value });
  document.getElementById("loginMsg").textContent = error ? "❌ " + error.message : "";
  if (!error) showAdmin();
});

function showAdminTab(tab) {
  ["properties","rooms","tiffin","inventory","inquiries"].forEach(t => {
    document.getElementById("admin-" + t).style.display = (t === tab) ? "block" : "none";
  });
}

// ---------------- PHOTO UPLOAD ----------------
// Uploads files to Supabase Storage bucket "photos", returns array of public URLs
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

// ---------------- CUSTOM DETAILS (key/value/visible rows) ----------------
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
    <input placeholder="Value e.g. ₹10,000 deposit" class="dv" value="${escapeHtml(value)}">
    <label style="display:flex;align-items:center;gap:3px;font-size:.75rem;white-space:nowrap"><input type="checkbox" class="dvis" ${visible ? "checked" : ""}> show</label>
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

// ================= PROPERTIES =================
async function loadProperties() {
  const { data, error } = await supabaseClient.from("properties").select("*").order("created_at", { ascending: false });
  const el = document.getElementById("admin-properties");
  let html = `<button class="btn primary" onclick="openPropertyForm()">+ Add New Property</button><div id="propFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error loading properties.</div>`;
  else if (!data.length) html += `<div class="empty">No properties yet.</div>`;
  else html += data.map(p => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(p.title)}</strong><br><span class="muted">${escapeHtml(p.area)} · ${escapeHtml(p.type)} · ${p.availability ? "Available" : "Unavailable"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openPropertyForm(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick="deleteRecord('properties', ${p.id}, loadProperties)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}

function openPropertyForm(existing) {
  const wrap = document.getElementById("propFormWrap");
  const e = existing || {};
  wrap.innerHTML = `
    <form class="panel" id="propertyForm">
      <h3>${existing ? "Edit" : "Add"} Property</h3>
      <label>Title</label><input name="title" required value="${escapeHtml(e.title||"")}">
      <label>Area</label><input name="area" required value="${escapeHtml(e.area||"")}">
      <label>Type</label>
      <select name="type">
        ${["flat","homestay","hourly","land"].map(t => `<option value="${t}" ${e.type===t?"selected":""}>${t}</option>`).join("")}
      </select>
      <label>Price</label><input name="price" value="${escapeHtml(e.price||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Available</label>
      <label><input type="checkbox" name="has_rooms" ${e.has_rooms?"checked":""}> This property has multiple rooms (manage in Rooms tab)</label>
      <label>Photos (comma-separated URLs)</label>
      <textarea name="photos">${escapeHtml(e.photos||"")}</textarea>
      <label>Or upload photos directly</label>
      <input type="file" id="propPhotoUpload" multiple accept="image/*">
      <div class="upload-status" id="propUploadStatus"></div>
      <label>Videos (comma-separated YouTube/Drive links)</label>
      <textarea name="videos">${escapeHtml(e.videos||"")}</textarea>
      <label>Google Maps Link</label><input name="map_link" value="${escapeHtml(e.map_link||"")}">
      <label>Phone</label><input name="phone" value="${escapeHtml(e.phone||"")}">
      <label>WhatsApp (with country code, no +)</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label>Custom Details</label>
      <div id="propCustomDetails"></div>
      <button type="button" class="small-btn" onclick="addDetailRow('propCustomDetails')">+ Add Detail Row</button>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('propFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  renderCustomDetailsEditor("propCustomDetails", e.custom_details);

  document.getElementById("propertyForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const uploadInput = document.getElementById("propPhotoUpload");
    const uploadedUrls = await uploadPhotosToStorage(uploadInput, document.getElementById("propUploadStatus"));
    const existingPhotos = f.photos.value.trim();
    const allPhotos = [existingPhotos, ...uploadedUrls].filter(Boolean).join(",");

    const payload = {
      title: f.title.value, area: f.area.value, type: f.type.value, price: f.price.value,
      availability: f.availability.checked, has_rooms: f.has_rooms.checked,
      photos: allPhotos, videos: f.videos.value.trim(),
      map_link: f.map_link.value.trim(), phone: f.phone.value.trim(), whatsapp: f.whatsapp.value.trim(),
      custom_details: collectCustomDetails("propCustomDetails")
    };
    let res;
    if (existing && existing.id) res = await supabaseClient.from("properties").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("properties").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("propFormWrap").innerHTML = "";
    loadProperties(); loadPropertyOptionsForRooms();
  });
}

// ================= ROOMS =================
async function loadPropertyOptionsForRooms() {
  const { data } = await supabaseClient.from("properties").select("id,title").eq("has_rooms", true).order("title");
  const el = document.getElementById("admin-rooms");
  const options = (data || []).map(p => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join("");
  el.innerHTML = `
    <label style="font-weight:600">Select Property (multi-room buildings only)</label>
    <select id="roomPropertySelect" onchange="loadRooms()" style="padding:9px;border-radius:8px;border:1px solid #ddd;margin-bottom:12px">
      <option value="">-- choose --</option>${options}
    </select>
    <div id="roomsListWrap"></div>`;
  if (!data || !data.length) el.innerHTML += `<div class="empty">No multi-room properties yet. Tick "has multiple rooms" on a property first.</div>`;
}

async function loadRooms() {
  const propertyId = document.getElementById("roomPropertySelect").value;
  const wrap = document.getElementById("roomsListWrap");
  if (!propertyId) { wrap.innerHTML = ""; return; }
  const { data, error } = await supabaseClient.from("rooms").select("*").eq("property_id", propertyId).order("title");
  let html = `<button class="btn primary" onclick="openRoomForm(${propertyId})">+ Add Room</button><div id="roomFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">No rooms added yet.</div>`;
  else html += data.map(r => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(r.title)}</strong><br><span class="muted">${escapeHtml(r.rent||"")} · ${r.availability?"Available":"Unavailable"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openRoomForm(${propertyId}, ${JSON.stringify(r).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick="deleteRecord('rooms', ${r.id}, loadRooms)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  wrap.innerHTML = html;
}

function openRoomForm(propertyId, existing) {
  const wrap = document.getElementById("roomFormWrap");
  const e = existing || {};
  wrap.innerHTML = `
    <form class="panel" id="roomForm">
      <h3>${existing ? "Edit" : "Add"} Room</h3>
      <label>Room Title</label><input name="title" required value="${escapeHtml(e.title||"")}">
      <label>Rent</label><input name="rent" value="${escapeHtml(e.rent||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Available</label>
      <label>Photos (comma-separated URLs)</label>
      <textarea name="photos">${escapeHtml(e.photos||"")}</textarea>
      <label>Or upload photos directly</label>
      <input type="file" id="roomPhotoUpload" multiple accept="image/*">
      <div class="upload-status" id="roomUploadStatus"></div>
      <label>Videos (comma-separated links)</label>
      <textarea name="videos">${escapeHtml(e.videos||"")}</textarea>
      <label>Custom Details</label>
      <div id="roomCustomDetails"></div>
      <button type="button" class="small-btn" onclick="addDetailRow('roomCustomDetails')">+ Add Detail Row</button>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('roomFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  renderCustomDetailsEditor("roomCustomDetails", e.custom_details);

  document.getElementById("roomForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const uploadInput = document.getElementById("roomPhotoUpload");
    const uploadedUrls = await uploadPhotosToStorage(uploadInput, document.getElementById("roomUploadStatus"));
    const allPhotos = [f.photos.value.trim(), ...uploadedUrls].filter(Boolean).join(",");
    const payload = {
      property_id: propertyId, title: f.title.value, rent: f.rent.value, availability: f.availability.checked,
      photos: allPhotos, videos: f.videos.value.trim(), custom_details: collectCustomDetails("roomCustomDetails")
    };
    let res;
    if (existing && existing.id) res = await supabaseClient.from("rooms").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("rooms").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("roomFormWrap").innerHTML = "";
    loadRooms();
  });
}

// ================= TIFFIN =================
async function loadTiffin() {
  const { data, error } = await supabaseClient.from("tiffin").select("*").order("created_at", { ascending: false });
  const el = document.getElementById("admin-tiffin");
  let html = `<button class="btn primary" onclick="openTiffinForm()">+ Add Tiffin Area</button><div id="tiffinFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">No tiffin areas yet.</div>`;
  else html += data.map(t => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(t.area)}</strong><br><span class="muted">${escapeHtml(t.price||"")} · ${t.availability?"Taking orders":"Full"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openTiffinForm(${JSON.stringify(t).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick="deleteRecord('tiffin', ${t.id}, loadTiffin)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}
function openTiffinForm(existing) {
  const wrap = document.getElementById("tiffinFormWrap");
  const e = existing || {};
  wrap.innerHTML = `
    <form class="panel" id="tiffinForm">
      <h3>${existing ? "Edit" : "Add"} Tiffin Area</h3>
      <label>Area</label><input name="area" required value="${escapeHtml(e.area||"")}">
      <label>Price</label><input name="price" value="${escapeHtml(e.price||"")}">
      <label>Menu / Notes</label><textarea name="menu">${escapeHtml(e.menu||"")}</textarea>
      <label>WhatsApp (with country code, no +)</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Taking new orders</label>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('tiffinFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  document.getElementById("tiffinForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const payload = { area: f.area.value, price: f.price.value, menu: f.menu.value, whatsapp: f.whatsapp.value.trim(), availability: f.availability.checked };
    let res;
    if (existing && existing.id) res = await supabaseClient.from("tiffin").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("tiffin").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("tiffinFormWrap").innerHTML = "";
    loadTiffin();
  });
}

// ================= INVENTORY =================
async function loadInventory() {
  const { data, error } = await supabaseClient.from("inventory").select("*").order("created_at", { ascending: false });
  const el = document.getElementById("admin-inventory");
  let html = `<button class="btn primary" onclick="openInventoryForm()">+ Add Item</button><div id="invFormWrap"></div><div style="margin-top:14px">`;
  if (error) html += `<div class="empty">Error.</div>`;
  else if (!data.length) html += `<div class="empty">No items yet.</div>`;
  else html += data.map(i => `
    <div class="admin-list-item">
      <div><strong>${escapeHtml(i.item)}</strong><br><span class="muted">${escapeHtml(i.price||"")} · ${i.availability?"Available":"Sold"}</span></div>
      <div class="actions">
        <button class="small-btn" onclick='openInventoryForm(${JSON.stringify(i).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="small-btn" onclick="deleteRecord('inventory', ${i.id}, loadInventory)">Delete</button>
      </div>
    </div>`).join("");
  html += `</div>`;
  el.innerHTML = html;
}
function openInventoryForm(existing) {
  const wrap = document.getElementById("invFormWrap");
  const e = existing || {};
  wrap.innerHTML = `
    <form class="panel" id="invForm">
      <h3>${existing ? "Edit" : "Add"} Item</h3>
      <label>Item Name</label><input name="item" required value="${escapeHtml(e.item||"")}">
      <label>Price</label><input name="price" value="${escapeHtml(e.price||"")}">
      <label>Photos (comma-separated URLs)</label>
      <textarea name="photos">${escapeHtml(e.photos||"")}</textarea>
      <label>Or upload photos directly</label>
      <input type="file" id="invPhotoUpload" multiple accept="image/*">
      <div class="upload-status" id="invUploadStatus"></div>
      <label>WhatsApp (with country code, no +)</label><input name="whatsapp" value="${escapeHtml(e.whatsapp||"")}">
      <label><input type="checkbox" name="availability" ${e.availability!==false?"checked":""}> Available</label>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button type="submit" class="btn primary">Save</button>
        <button type="button" class="btn" onclick="document.getElementById('invFormWrap').innerHTML=''">Cancel</button>
      </div>
    </form>`;
  document.getElementById("invForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const uploadInput = document.getElementById("invPhotoUpload");
    const uploadedUrls = await uploadPhotosToStorage(uploadInput, document.getElementById("invUploadStatus"));
    const allPhotos = [f.photos.value.trim(), ...uploadedUrls].filter(Boolean).join(",");
    const payload = { item: f.item.value, price: f.price.value, photos: allPhotos, whatsapp: f.whatsapp.value.trim(), availability: f.availability.checked };
    let res;
    if (existing && existing.id) res = await supabaseClient.from("inventory").update(payload).eq("id", existing.id);
    else res = await supabaseClient.from("inventory").insert(payload);
    if (res.error) { alert("Error: " + res.error.message); return; }
    document.getElementById("invFormWrap").innerHTML = "";
    loadInventory();
  });
}

// ================= INQUIRIES (read-only + delete) =================
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

// ================= SHARED DELETE =================
async function deleteRecord(table, id, reload) {
  if (!confirm("Delete this record?")) return;
  const { error } = await supabaseClient.from(table).delete().eq("id", id);
  if (error) { alert("Error: " + error.message); return; }
  reload();
}

checkSession();
