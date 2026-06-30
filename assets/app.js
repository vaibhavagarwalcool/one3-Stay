// --- Setup & Helpers ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("bizName").textContent = BUSINESS_NAME;
  renderExtraServices();
  
  // Deep linking: If URL has ?prop=ID, filter to show only that
  const params = new URLSearchParams(window.location.search);
  const propId = params.get('prop');
  loadProperties(propId);
  loadTiffin();
  loadInventory();
});

let allProperties = [];
const DEFAULT_WA = "919999999999"; // Fallback WhatsApp number

function waLink(number, text) {
  const num = number || DEFAULT_WA;
  return `https://wa.me/${num.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
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
    document.getElementById("tab-" + t).style.display = (t === tab) ? "block" : "none";
  });
  document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
}

// --- Properties Logic ---
async function loadProperties(deepLinkId = null) {
  // Fetch properties ordered by Pinned first, then newest
  const { data, error } = await supabaseClient.from("properties")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
    
  if (error) { document.getElementById("propertiesGrid").innerHTML = `<div class="empty">Error loading data.</div>`; return; }
  allProperties = data || [];
  
  if (deepLinkId) {
    document.getElementById("searchBox").value = "";
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
    (p.title.toLowerCase().includes(q) || p.area.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
  );
  renderProperties(filtered);
}

function renderProperties(list) {
  const grid = document.getElementById("propertiesGrid");
  if (!list.length) { grid.innerHTML = `<div class="empty">No properties found.</div>`; return; }
  grid.innerHTML = list.map(p => {
    const photos = p.photos ? p.photos.split(",").map(s=>s.trim()) : [];
    const mainImg = photos.length ? photos[0] : "https://placehold.co/600x400?text=No+Photo";
    const waMsg = `Hi, I'm interested in ${p.title} (ID: ${p.id}).`;
    const pinBadge = p.pinned ? `<div class="badge pin">⭐ Featured</div>` : "";
    const typeBadge = `<div class="badge type">${p.type}</div>`;
    
    // Description logic
    const descText = p.description ? p.description : "";
    
    return `
    <div class="card">
      <div class="img-wrap">
        ${pinBadge} ${typeBadge}
        <img src="${mainImg}" loading="lazy" onclick="openModal('prop', ${p.id})">
      </div>
      <div class="card-body">
        <div class="price-title">
          <h3>${p.title}</h3>
          <span class="price">${p.price || "On Request"}</span>
        </div>
        <div class="muted">📍 ${p.area}</div>
        <div class="desc line-clamp">${descText}</div>
        <a class="read-more" onclick="openModal('prop', ${p.id})">Read More & View Rooms</a>
        <div class="btn-row">
          <a class="btn wa" href="${waLink(p.whatsapp, waMsg)}" target="_blank">WhatsApp</a>
          <button class="btn share" onclick="shareListing('${p.id}', '${p.title}')">🔗 Share</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

// --- Services Grid (Hardcoded per request) ---
function renderExtraServices() {
  const srv = ["Rental & Legal Drafting", "Trademark Registration", "Website Building", "Packers and Movers", "RO/AC Service", "Electrician", "Cleaning", "Lift Service", "Tile Installation", "Interior Consultation", "End-to-end PG Maintenance", "Gemstones", "Bulk Anaj & Spices", "Bulk Building Material"];
  document.getElementById("servicesGrid").innerHTML = srv.map(s => `
    <div class="service-card">
      <h4>${s}</h4>
      <a class="btn wa small" href="${waLink(DEFAULT_WA, `I need help with ${s}`)}" target="_blank">Chat with us</a>
    </div>
  `).join("");
}

// --- Tiffin & Inventory (Simplified) ---
async function loadTiffin() { /* Keep existing logic, just add share button if desired */ }
async function loadInventory() { /* Keep existing logic */ }

// --- Modal Logic (For long details & Rooms) ---
async function openModal(type, id) {
  const overlay = document.getElementById("detailModal");
  const body = document.getElementById("modalBody");
  overlay.style.display = "flex";
  body.innerHTML = "Loading...";

  if (type === 'prop') {
    const p = allProperties.find(x => x.id == id);
    const photosHtml = p.photos ? p.photos.split(",").map(url => `<img src="${url.trim()}">`).join("") : "";
    
    let roomsHtml = "";
    if (p.has_rooms) {
      const { data } = await supabaseClient.from("rooms").select("*").eq("property_id", id);
      if (data && data.length) {
        roomsHtml = `<h4 style="margin-top:20px">Available Rooms</h4>` + data.map(r => `
          <div class="room-row">
            <strong>${r.title}</strong> - ${r.rent}
            <a href="${waLink(p.whatsapp, `Interested in ${r.title} at ${p.title}`)}" target="_blank" class="btn wa small">Inquire</a>
          </div>
        `).join("");
      }
    }

    body.innerHTML = `
      <button class="close-modal" onclick="closeModal(event)">✕</button>
      <h2>${p.title}</h2>
      <div class="price">${p.price}</div>
      <p>📍 ${p.area}</p>
      <div class="modal-desc">${p.description || ""}</div>
      <div class="modal-gallery">${photosHtml}</div>
      ${roomsHtml}
    `;
  }
}

function closeModal(e) {
  if (e.target.id === 'detailModal' || e.target.classList.contains('close-modal')) {
    document.getElementById("detailModal").style.display = "none";
  }
}
