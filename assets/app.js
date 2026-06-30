const DEFAULT_WA = "919999999999"; 

function waLink(number, text) {
  const num = number || DEFAULT_WA;
  return `https://wa.me/${num.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}

function callLink(number) {
  if (!number) return "#";
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function waPartner(role) {
  window.open(waLink(DEFAULT_WA, `Hi, I am a ${role} and I would like to partner with you.`), '_blank');
}

function shareListing(id, title) {
  const url = `${window.location.origin}${window.location.pathname}?prop=${id}`;
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard! Share it anywhere.");
  }
}

function showTab(tab) {
  ["properties", "tiffin", "inventory", "services", "form"].forEach(t => {
    const el = document.getElementById("tab-" + t);
    if(el) el.style.display = (t === tab) ? "block" : "none";
  });
  document.querySelectorAll("nav.tabs button").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
}

let allProperties = [];

document.addEventListener("DOMContentLoaded", () => {
  const bizNameEl = document.getElementById("bizName");
  if(bizNameEl) bizNameEl.textContent = BUSINESS_NAME;
  
  if(document.getElementById("servicesGrid")) {
    renderExtraServices();
  }
  
  const params = new URLSearchParams(window.location.search);
  const propId = params.get('prop');
  
  // Only load these if we are on the public page (not admin)
  if(document.getElementById("propertiesGrid")) {
    loadPropertiesPublic(propId);
    loadTiffinPublic();
    loadInventoryPublic();
  }
});

async function loadPropertiesPublic(deepLinkId = null) {
  const grid = document.getElementById("propertiesGrid");
  const { data, error } = await supabaseClient.from("properties")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
    
  if (error) { 
    grid.innerHTML = `<div class="empty">Error loading data. Did you run the updated schema.sql? (${error.message})</div>`; 
    return; 
  }
  allProperties = data || [];
  
  if (deepLinkId) {
    const sb = document.getElementById("searchBox");
    if(sb) sb.value = "";
    const filtered = allProperties.filter(p => p.id == deepLinkId);
    renderProperties(filtered.length ? filtered : allProperties);
  } else {
    renderProperties(allProperties);
  }
}

function filterProperties() {
  const q = document.getElementById("searchBox").value.toLowerCase();
  const type = document.getElementById("typeFilter").value;
  const filtered = allProperties.filter(p => 
    (!type || p.type === type) &&
    ((p.title||"").toLowerCase().includes(q) || (p.area||"").toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q))
  );
  renderProperties(filtered);
}

function renderProperties(list) {
  const grid = document.getElementById("propertiesGrid");
  if (!list.length) { grid.innerHTML = `<div class="empty">No properties found.</div>`; return; }
  grid.innerHTML = list.map(p => {
    const photos = p.photos ? p.photos.split(",").map(s=>s.trim()).filter(Boolean) : [];
    const mainImg = photos.length ? photos[0] : "https://placehold.co/600x400?text=No+Photo";
    const waMsg = `Hi, I'm interested in ${p.title} (ID: ${p.id}).`;
    const pinBadge = p.pinned ? `<div class="badge pin">⭐ Featured</div>` : "";
    const typeBadge = `<div class="badge type">${p.type}</div>`;
    const descText = p.description ? escapeHtml(p.description) : "";
    
    return `
    <div class="card">
      <div class="img-wrap" onclick="openModal('prop', ${p.id})">
        ${pinBadge} ${typeBadge}
        <img src="${mainImg}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="price-title">
          <h3>${escapeHtml(p.title)}</h3>
          <span class="price">${escapeHtml(p.price || "On Request")}</span>
        </div>
        <div class="muted">📍 ${escapeHtml(p.area)}</div>
        <div class="desc line-clamp">${descText}</div>
        <a class="read-more" onclick="openModal('prop', ${p.id})">Read More & View Rooms</a>
        <div class="btn-row">
          <a class="btn wa" href="${waLink(p.whatsapp, waMsg)}" target="_blank">WhatsApp</a>
          <button class="btn share" onclick="shareListing('${p.id}', '${escapeHtml(p.title)}')">🔗 Share</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

function renderExtraServices() {
  const srv = ["Rental & Legal Drafting", "Trademark Registration", "Website Building", "Packers and Movers", "RO/AC Service", "Electrician", "Cleaning", "Lift Service", "Tile Installation", "Interior Consultation", "End-to-end PG Maintenance", "Gemstones", "Bulk Anaj & Spices", "Bulk Building Material"];
  document.getElementById("servicesGrid").innerHTML = srv.map(s => `
    <div class="service-card">
      <h4>${s}</h4>
      <a class="btn wa small" href="${waLink(DEFAULT_WA, `I need help with ${s}`)}" target="_blank">Chat with us</a>
    </div>
  `).join("");
}

async function loadTiffinPublic() {
  const grid = document.getElementById("tiffinGrid");
  const { data, error } = await supabaseClient.from("tiffin").select("*").order("created_at", { ascending: false });
  if (error || !data || !data.length) { grid.innerHTML = `<div class="empty">No tiffin services currently.</div>`; return; }
  grid.innerHTML = data.map(t => `
    <div class="card">
      <div class="card-body">
        <span class="badge type" style="position:static;display:inline-block;width:fit-content;margin-bottom:8px">Tiffin</span>
        <h3>${escapeHtml(t.area)}</h3>
        <div class="price">${escapeHtml(t.price || "")}</div>
        <div class="muted">${escapeHtml(t.menu || "")}</div>
        <div class="btn-row">
          <a class="btn wa" href="${waLink(t.whatsapp, `Hi, I'd like tiffin service details for ${t.area}`)}" target="_blank">WhatsApp</a>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadInventoryPublic() {
  const grid = document.getElementById("inventoryGrid");
  const { data, error } = await supabaseClient.from("inventory").select("*").order("created_at", { ascending: false });
  if (error || !data || !data.length) { grid.innerHTML = `<div class="empty">No items listed.</div>`; return; }
  grid.innerHTML = data.map(i => {
    const mainImg = i.photos ? i.photos.split(",")[0].trim() : "https://placehold.co/600x400?text=No+Photo";
    return `
    <div class="card">
      <div class="img-wrap"><img src="${mainImg}" loading="lazy"></div>
      <div class="card-body">
        <h3>${escapeHtml(i.item)}</h3>
        <div class="price">${escapeHtml(i.price || "")}</div>
        <div class="btn-row">
          <a class="btn wa" href="${waLink(i.whatsapp, `Hi, I'm interested in buying: ${i.item}`)}" target="_blank">Inquire</a>
        </div>
      </div>
    </div>
  `}).join("");
}

async function openModal(type, id) {
  const overlay = document.getElementById("detailModal");
  const body = document.getElementById("modalBody");
  overlay.style.display = "flex";
  body.innerHTML = "<div style='text-align:center;padding:40px'>Loading details...</div>";

  if (type === 'prop') {
    const p = allProperties.find(x => x.id == id);
    if(!p) return;
    const photos = p.photos ? p.photos.split(",").map(s=>s.trim()).filter(Boolean) : [];
    const photosHtml = photos.map(url => `<img src="${url}">`).join("");
    
    let roomsHtml = "";
    if (p.has_rooms) {
      const { data } = await supabaseClient.from("rooms").select("*").eq("property_id", id);
      if (data && data.length) {
        roomsHtml = `<h4 style="margin-top:24px;border-bottom:2px solid #eee;padding-bottom:8px">Available Rooms</h4>` + data.map(r => `
          <div class="room-row">
            <div>
              <strong>${escapeHtml(r.title)}</strong><br>
              <span class="muted">${escapeHtml(r.rent)}</span>
            </div>
            <a href="${waLink(p.whatsapp, `I'm interested in ${r.title} at ${p.title}`)}" target="_blank" class="btn wa small">Inquire</a>
          </div>
        `).join("");
      } else {
        roomsHtml = `<h4 style="margin-top:24px">Rooms</h4><p class="muted">No individual rooms listed yet.</p>`;
      }
    }

    body.innerHTML = `
      <button class="close-modal" onclick="closeModal(event)">✕</button>
      <h2 style="margin:0 0 10px 0">${escapeHtml(p.title)}</h2>
      <div class="price" style="font-size:1.2rem;margin-bottom:10px">${escapeHtml(p.price || "Price on request")}</div>
      <p style="margin:0 0 16px 0;color:#666">📍 ${escapeHtml(p.area)}</p>
      
      <div class="btn-row" style="margin-bottom:20px">
        <a class="btn wa" href="${waLink(p.whatsapp, `Hi, I'm interested in ${p.title} (ID: ${p.id}).`)}" target="_blank">💬 Chat on WhatsApp</a>
        <a class="btn call" href="${callLink(p.phone)}">📞 Call</a>
      </div>

      ${photos.length ? `<div class="modal-gallery">${photosHtml}</div>` : ""}
      
      ${p.description ? `<h4 style="margin-bottom:8px">Description</h4><div class="modal-desc">${escapeHtml(p.description)}</div>` : ""}
      
      ${roomsHtml}
    `;
  }
}

function closeModal(e) {
  if (e.target.id === 'detailModal' || e.target.classList.contains('close-modal')) {
    document.getElementById("detailModal").style.display = "none";
  }
}

// Inquiry Form Logic
const inqForm = document.getElementById("inquiryForm");
if(inqForm) {
  inqForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const { error } = await supabaseClient.from("inquiries").insert({
      name: f.name.value, phone: f.phone.value, type: f.type.value, message: f.message.value
    });
    document.getElementById("formMsg").textContent = error ? "Error submitting." : "✅ Submitted!";
    if (!error) f.reset();
  });
}
