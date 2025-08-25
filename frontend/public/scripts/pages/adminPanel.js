// scripts/pages/adminPanel.js
$(async function () {
  // Auth base 
  const token = localStorage.getItem("authToken");
  const userDataLS = JSON.parse(localStorage.getItem("userData") || "{}");
  if (!token) { window.location.href = "login.html"; return; }

  // API roots
  const API_ROOT = apiConfig.apiUrl;
  const API_USERS = `${API_ROOT}/users`;
  const API_SEDI  = `${API_ROOT}/sedi`;
  const API_SPAZI = `${API_ROOT}/spazi`;
  const API_PREN  = `${API_ROOT}/prenotazioni`;
  const API_DISP  = `${API_ROOT}/disponibilita`; // usato solo per eventuali estensioni

  //  Supabase (avatar) 
  const SUPABASE_URL = apiConfig.supabaseUrl;
  const SUPABASE_BUCKET = apiConfig.supabaseBucket || "avatars";
  function supaPublicUrl(path) {
    if (!path || !SUPABASE_URL) return null;
    const clean = String(path).replace(new RegExp(`^${SUPABASE_BUCKET}/`), "");
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${clean}`;
  }
  function setImg($img, url, fallback = "./assets/placeholderProfilo.jpeg") {
    $img.attr("src", url || fallback).off("error").on("error", function () {
      $(this).attr("src", fallback);
    });
  }

  //  Helpers UI 
  function loadingRow(cols, txt = "Caricamento...") {
    return `<tr><td colspan="${cols}" class="text-muted text-center">${txt}</td></tr>`;
  }
  function errorRow(cols, txt = "Errore nel caricamento.") {
    return `<tr><td colspan="${cols}" class="text-danger text-center">${txt}</td></tr>`;
  }
  function escapeHtml(str) { return String(str ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function getStatusBadge(status) {
    const s = String(status || "").toLowerCase();
    if (["pagato","paid","confermato"].includes(s)) return "bg-success";
    if (["annullato","cancellato","rifiutato"].includes(s)) return "bg-danger";
    if (["in_attesa","pending"].includes(s)) return "bg-warning text-dark";
    return "bg-secondary";
  }
  function toast(msg, ok = true) {
    const $t = $("#admin-toast");
    $t.removeClass("bg-success bg-danger").addClass(ok ? "bg-success" : "bg-danger");
    $t.find(".toast-body").text(msg || (ok ? "Operazione completata" : "Operazione non riuscita"));
    const inst = bootstrap.Toast.getOrCreateInstance($t[0], { delay: 2000 });
    inst.show();
  }

  //  HTTP helpers 
  function get(url, headers = {}) {
    return $.ajax({ url, type: "GET", headers: { Authorization: "Bearer " + token, ...headers } });
  }
  function tryFirstOk(urls, opts = {}) {
    // prova una lista di URL finché uno risponde 2xx
    return new Promise(async (resolve, reject) => {
      for (const u of urls) {
        try { const res = await $.ajax({ url: u, headers: { Authorization: "Bearer " + token }, ...opts }); return resolve({ data: res, used: u }); }
        catch (e) { /* tenta il prossimo */ }
      }
      reject(new Error("Nessun endpoint disponibile"));
    });
  }

  // Bootstrap utente (must be admin) 
  async function fetchMe() {
    try {
      return await get(`${API_USERS}/me`);
    } catch {
      // fallback a localStorage solo per evitare hard-stop in caso di /me offline
      return userDataLS || {};
    }
  }

  let me = {};
  try {
    me = await fetchMe();
    const ruolo = String(me?.ruolo || "").toLowerCase();
    if (ruolo !== "admin") { window.location.href = "profilo.html"; return; }

    // Header avatar+info
    $("#admin-name").text(me.nome || "Admin");
    $("#admin-email").text(me.email || "");
    const avatar = me.profileImageUrl || (me.profile_image ? supaPublicUrl(me.profile_image) : null);
    setImg($("#admin-avatar"), avatar);
  } catch {
    window.location.href = "login.html";
    return;
  }

  // Logout 
  $("#logout-admin").on("click", function () {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });

  // Sezioni 
  // Navigazione è già gestita in adminPanel.html; qui carichiamo i dati on-show
  $(".content-section").hide();
  $("#dashboard-section").show().addClass("active");

  // Click nav → carica on-demand
  $(document).on("click", ".profile-nav .nav-item", function () {
    const target = $(this).data("target");
    if (!target) return;

    switch (target) {
      case "dashboard-section":     loadDashboard(); break;
      case "users-section":         loadUsers();     break;
      case "sedi-section":          loadSedi();      break;
      case "spazi-section":         loadSpazi();     break;
      case "prenotazioni-section":  loadPrenotazioni(); break;
    }
  });

  // DASHBOARD 
  async function loadDashboard() {
    // KPI: prenotazioni oggi / settimana / mese, sedi attive, gestori attivi
    $("#kpi-pren-today, #kpi-pren-week, #kpi-pren-month, #kpi-sedi-attive, #kpi-gestori-attivi").text("—");

    try {
      // Sedi (per contare attive e ricavare potenziali gestori)
      const sedi = (await get(`${API_SEDI}/getSedi`)) || [];
      const sediAttive = sedi.filter(s => s.attiva === true || s.attiva === 1 || String(s.attiva) === "true");
      $("#kpi-sedi-attive").text(sediAttive.length);

      // Gestori attivi (se la sede espone id_gestore; altrimenti "—")
      const gestoriSet = new Set();
      sedi.forEach(s => { if (s.id_gestore != null) gestoriSet.add(String(s.id_gestore)); });
      $("#kpi-gestori-attivi").text(gestoriSet.size || "—");

      // Prenotazioni (aggrego da tutti gli spazi)
      const pren = await getAllPrenotazioni();
      // conteggi tempo
      const now = new Date();
      const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let cToday = 0, cWeek = 0, cMonth = 0;
      const series = {}; // yyyy-mm-dd -> count
      (pren || []).forEach(p => {
        const d = pickPrenDate(p);
        if (!d) return;
        const dayKey = d.toISOString().slice(0, 10);
        series[dayKey] = (series[dayKey] || 0) + 1;
        if (sameDate(d, now)) cToday++;
        if (d >= startOfWeek) cWeek++;
        if (d >= startOfMonth) cMonth++;
      });

      $("#kpi-pren-today").text(cToday);
      $("#kpi-pren-week").text(cWeek);
      $("#kpi-pren-month").text(cMonth);

      drawOrdersChart(series);
    } catch (e) {
      console.error(e);
      // lascio i trattini
    }
  }

  function pickPrenDate(p) {
    // usa data_creazione; altrimenti data + ora_inizio
    if (p.data_creazione) return new Date(p.data_creazione);
    if (p.data) return new Date(`${p.data}T${p.ora_inizio || "00:00"}`);
    if (p.created_at) return new Date(p.created_at);
    return null;
  }
  function sameDate(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  let ordersChart;
  function drawOrdersChart(seriesObj) {
    const ctx = document.getElementById("admin-ordersChart");
    if (!ctx) return;

    // prendo ultimi 30 giorni
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0,10);
      labels.push(d.toLocaleDateString("it-IT", { day:"2-digit", month:"2-digit" }));
      data.push(seriesObj[key] || 0);
    }

    if (ordersChart) ordersChart.destroy();
    ordersChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{ label: "Prenotazioni (ultimi 30 gg)", data, tension: 0.3 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true, precision: 0 } }
      }
    });
  }

  // UTENTI 

let __usersCache = new Map(); // cache per aprire il modal senza rifare chiamate

async function loadUsers() {
  ensureUserEditModal(); // assicura che il modal esista

  const $tb = $("#tbl-users tbody").html(loadingRow(6));
  try {
    // prova in ordine le rotte che hai nel backend
    const probe = await tryFirstOk([
      `${API_USERS}/getAllUsers`,
      `${API_USERS}/list`,
      `${API_USERS}/getUsers`,
    ]);

    const users = Array.isArray(probe.data) ? probe.data : (probe.data?.rows || []);
    if (!users?.length) {
      $tb.html(`<tr><td colspan="6" class="text-muted text-center">Nessun utente trovato.</td></tr>`);
      return;
    }

    // cache
    __usersCache.clear();
    users.forEach(u => __usersCache.set(String(u.id), u));

    // render
    $tb.empty();
    users.forEach(u => {
      const ruolo  = (u.ruolo || u.role || "").toString();
      const creato = u.created_at || u.createdAt || u.data_creazione;
      const dateStr = creato ? new Date(creato).toLocaleString("it-IT") : "—";

      $tb.append(`
        <tr data-id="${u.id ?? ""}">
          <td>${u.id ?? "—"}</td>
          <td>${escapeHtml(u.nome || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—")}</td>
          <td>${escapeHtml(u.email || "—")}</td>
          <td>${escapeHtml(ruolo || "—")}</td>
          <td>${dateStr}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary btn-edit-user" data-id="${u.id ?? ""}" title="Modifica">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
          </td>
        </tr>
      `);
    });
  } catch (e) {
    console.error("users load error", e);
    $tb.html(errorRow(6, "Endpoint utenti non disponibile."));
  }
}

// === MODAL MODIFICA UTENTE ================================================
function ensureUserEditModal() {
  if ($("#modalUserEdit").length) return;

  $("body").append(`
    <div class="modal fade" id="modalUserEdit" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form class="modal-content" id="form-user-edit">
          <div class="modal-header">
            <h5 class="modal-title">Modifica utente</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="ue-id">
            <div class="mb-3">
              <label class="form-label">Nome</label>
              <input type="text" class="form-control" id="ue-nome" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Cognome</label>
              <input type="text" class="form-control" id="ue-cognome">
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" id="ue-email" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Telefono</label>
              <input type="text" class="form-control" id="ue-telefono">
            </div>
            <div class="mb-3">
              <label class="form-label">Data di nascita</label>
              <input type="date" class="form-control" id="ue-dob">
            </div>
            <p class="small text-muted mb-0">Il ruolo non si cambia da qui.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Annulla</button>
            <button class="btn btn-primary" type="submit">Salva modifiche</button>
          </div>
        </form>
      </div>
    </div>
  `);
}

// Apri modal su click "Modifica"
$(document).on("click", ".btn-edit-user", function () {
  const id = String($(this).data("id") || "");
  const u  = __usersCache.get(id);
  if (!u) return;

  $("#ue-id").val(id);
  $("#ue-nome").val(u.nome || u.first_name || "");
  $("#ue-cognome").val(u.cognome || u.last_name || "");
  $("#ue-email").val(u.email || "");
  $("#ue-telefono").val(u.telefono || u.numero_telefono || "");
  const dob = u.data_nascita ? String(u.data_nascita).slice(0,10) : (u.dob ? String(u.dob).slice(0,10) : "");
  $("#ue-dob").val(dob);

  new bootstrap.Modal(document.getElementById("modalUserEdit")).show();
});

// Submit modifica → PUT /users/updateInfo/:id
$(document).on("submit", "#form-user-edit", async function (e) {
  e.preventDefault();
  const id = $("#ue-id").val();
  const payload = {
    nome: $("#ue-nome").val().trim(),
    cognome: $("#ue-cognome").val().trim(),
    email: $("#ue-email").val().trim(),
    telefono: $("#ue-telefono").val().trim(),
    data_nascita: $("#ue-dob").val() || null
  };

  try {
    await $.ajax({
      url: `${API_USERS}/updateInfo/${encodeURIComponent(id)}`,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify(payload),
      headers: { Authorization: "Bearer " + token }
    });

    // chiudi modal + feedback + ricarica lista
    bootstrap.Modal.getInstance(document.getElementById("modalUserEdit"))?.hide();
    toast("Utente aggiornato");
    loadUsers();
  } catch (err) {
    console.error(err);
    const msg = err?.responseJSON?.error || err?.responseJSON?.message || "Errore nell'aggiornamento";
    toast(msg, false);
  }
});

  // SEDI 
  async function loadSedi() {
    const $tb = $("#tbl-sedi tbody").html(loadingRow(6));
    try {
      const sedi = (await get(`${API_SEDI}/getAllSedi`)) || [];
      if (!sedi.length) { $tb.html(`<tr><td colspan="6" class="text-muted text-center">Nessuna sede trovata.</td></tr>`); return; }

      $tb.empty();
      sedi.forEach(s => {
        const stato = (s.attiva === true || s.attiva === 1 || String(s.attiva) === "true") ? "Attiva" : "Non attiva";
        const badge = (stato === "Attiva") ? "bg-success" : "bg-secondary";
        $tb.append(`
          <tr>
            <td>${s.id ?? "—"}</td>
            <td>${escapeHtml(s.nome || "—")}</td>
            <td>${escapeHtml([s.indirizzo, s.citta].filter(Boolean).join(", ") || "—")}</td>
            <td><span class="badge ${badge}">${stato}</span></td>
            <td>${s.id_gestore ?? "—"}</td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary" href="sede.html?id=${s.id ?? ""}">
                <i class="fa-solid fa-circle-info"></i>
              </a>
            </td>
          </tr>
        `);
      });
    } catch {
      $tb.html(errorRow(6));
    }
  }

  // SPAZI 
  async function loadSpazi() {
    const $tb = $("#tbl-spazi tbody").html(loadingRow(6));
    try {
      const spazi = (await get(`${API_SPAZI}/getSpazi`)) || [];
      if (!spazi.length) { $tb.html(`<tr><td colspan="6" class="text-muted text-center">Nessuno spazio trovato.</td></tr>`); return; }

      $tb.empty();
      spazi.forEach(sp => {
        const tipologia = (sp.tipologia || "").replaceAll("_"," ").replace(/^\w/, c => c.toUpperCase());
        const stato = (sp.attivo === true || sp.attivo === 1 || String(sp.attivo) === "true") ? "Attivo" : "Non attivo";
        const badge = (stato === "Attivo") ? "bg-success" : "bg-secondary";
        $tb.append(`
          <tr>
            <td>${sp.id ?? "—"}</td>
            <td>${escapeHtml(sp.nome || "—")}</td>
            <td>${escapeHtml(tipologia || "—")}</td>
            <td>${sp.id_sede ?? "—"}</td>
            <td><span class="badge ${badge}">${stato}</span></td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary" href="spazio.html?id=${sp.id ?? ""}">
                <i class="fa-solid fa-circle-info"></i>
              </a>
            </td>
          </tr>
        `);
      });
    } catch {
      $tb.html(errorRow(6));
    }
  }

  // PRENOTAZIONI 
  $("#btn-filter-pren").on("click", function () {
    const sedeId = $("#f-pren-sede").val().trim();
    loadPrenotazioni(sedeId || null);
  });

  async function loadPrenotazioni(sedeId = null) {
    const $tb = $("#tbl-pren tbody").html(loadingRow(8, "Caricamento prenotazioni..."));
    try {
      let spazi = [];
      if (sedeId) {
        spazi = (await get(`${API_SPAZI}/getSpazi?sede=${encodeURIComponent(sedeId)}`)) || [];
      } else {
        spazi = (await get(`${API_SPAZI}/getSpazi`)) || [];
      }
      if (!spazi.length) { $tb.html(`<tr><td colspan="8" class="text-muted text-center">Nessuna prenotazione.</td></tr>`); return; }

      // Per ciascuno spazio → prenotazioni
      const promises = spazi.map(sp =>
        get(`${API_PREN}/getPrenotazioniSpazio/${sp.id}`)
          .then(rows => (rows || []).map(p => ({ ...p, _spazio: sp })))
          .catch(() => [])
      );
      const nested = await Promise.all(promises);
      let pren = nested.flat();

      // Ordina per data desc
      pren.sort((a,b) => {
        const da = pickPrenDate(a)?.getTime() || 0;
        const db = pickPrenDate(b)?.getTime() || 0;
        return db - da;
      });

      if (!pren.length) { $tb.html(`<tr><td colspan="8" class="text-muted text-center">Nessuna prenotazione.</td></tr>`); return; }

      $tb.empty();
      pren.forEach(p => {
        const sedeName  = p._spazio?.sede_nome || p._spazio?.sede || p.sede?.nome || `Sede #${p._spazio?.id_sede ?? "—"}`;
        const cliente   = p.utente?.nome || p.cliente?.nome || `Utente #${p.id_utente ?? "—"}`;
        const stato     = p.stato || "—";
        const badge     = getStatusBadge(stato);
        const totale    = (p.importo ?? p.totale) != null ? parseFloat(p.importo ?? p.totale).toFixed(2) : "—";
        const d         = pickPrenDate(p);
        const dateStr   = d ? d.toLocaleString("it-IT", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

        $tb.append(`
          <tr>
            <td>${p.id ?? "—"}</td>
            <td>${p._spazio?.id_sede ?? "—"}</td>
            <td>${escapeHtml(sedeName)}</td>
            <td>${escapeHtml(cliente)}</td>
            <td><span class="badge ${badge}">${escapeHtml(stato)}</span></td>
            <td>€${totale}</td>
            <td>${dateStr}</td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary" href="spazio.html?id=${p._spazio?.id ?? ""}" title="Vai allo spazio">
                <i class="fa-solid fa-circle-info"></i>
              </a>
            </td>
          </tr>
        `);
      });
    } catch (e) {
      console.error(e);
      $tb.html(errorRow(8));
    }
  }

  async function getAllPrenotazioni() {
    // helper per dashboard: prende TUTTE le prenotazioni iterando gli spazi
    const spazi = (await get(`${API_SPAZI}/getSpazi`)) || [];
    if (!spazi.length) return [];
    const batches = await Promise.all(
      spazi.map(sp =>
        get(`${API_PREN}/getPrenotazioniSpazio/${sp.id}`)
          .then(rows => (rows || []).map(p => ({ ...p, _spazio: sp })))
          .catch(() => [])
      )
    );
    return batches.flat();
  }

  // Avvii iniziali 
  // Carica dashboard subito
  await loadDashboard();

  // Se arrivo con hash tipo #prenotazioni-section, apri quella sezione
  const initialTarget = (location.hash || "").replace("#", "");
  if (initialTarget) {
    $(`.profile-nav .nav-item[data-target="${initialTarget}"]`).trigger("click");
  }

});
