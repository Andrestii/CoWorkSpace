// scripts/pages/adminPanel.js
$(async function () {
  // Auth base 
  const token = localStorage.getItem("authToken");
  const userDataLS = JSON.parse(localStorage.getItem("userData") || "{}");
  if (!token) { window.location.href = "login.html"; return; }

  // API roots
  const API_ROOT = apiConfig.apiUrl;
  const API_USERS = `${API_ROOT}/users`;
  const API_SEDI = `${API_ROOT}/sedi`;
  const API_SPAZI = `${API_ROOT}/spazi`;
  const API_PREN = `${API_ROOT}/prenotazioni`;
  const API_DISP = `${API_ROOT}/disponibilita`; // usato solo per eventuali estensioni

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
  function escapeHtml(str) { return String(str ?? "").replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s])); }
  function getStatusBadge(status) {
    const s = String(status || "").toLowerCase();
    if (["pagato", "paid", "confermato"].includes(s)) return "bg-success";
    if (["annullato", "cancellato", "rifiutato"].includes(s)) return "bg-danger";
    if (["in_attesa", "pending"].includes(s)) return "bg-warning text-dark";
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
      case "dashboard-section": loadDashboard(); break;
      case "users-section": loadUsers(); break;
      case "sedi-section": loadSedi(); break;
      case "spazi-section": loadSpazi(); break;
      case "prenotazioni-section": loadPrenotazioni(); break;
    }
  });

  // DASHBOARD 
  async function loadDashboard() {
    // KPI: prenotazioni oggi / settimana / mese, sedi attive, gestori attivi
    $("#kpi-pren-today, #kpi-pren-week, #kpi-pren-month, #kpi-sedi-attive, #kpi-gestori-attivi").text("—");

    try {
      // Sedi (per contare attive e ricavare potenziali gestori)
      const sedi = (await get(`${API_SEDI}/getAllSedi`)) || [];
      const sediAttive = sedi.filter(s => s.attiva === true || s.attiva === 1 || String(s.attiva) === "true");
      $("#kpi-sedi-attive").text(sediAttive.length);

      // Gestori attivi
      let gestoriCount = "—";

      // 1) Se qualche endpoint delle sedi restituisce un id_gestore, usalo (compatibile con eventuali API future)
      const gestoriSet = new Set();
      sedi.forEach(s => { if (s.id_gestore != null) gestoriSet.add(String(s.id_gestore)); });
      if (gestoriSet.size > 0) {
        gestoriCount = gestoriSet.size;
      } else {
        // 2) Fallback robusto: conta gli utenti con ruolo "gestore" e non bannati
        try {
          const allUsers = await get(`${API_USERS}/getAllUsers`);
          gestoriCount = (allUsers || []).filter(u =>
            String(u.ruolo || "").toLowerCase() === "gestore" && !u.isBanned
          ).length;
        } catch (e) {
          console.warn("Impossibile caricare gli utenti per il conteggio gestori.", e);
        }
      }

      $("#kpi-gestori-attivi").text(gestoriCount);

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
  function sameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

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
      const key = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }));
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
        const ruolo = (u.ruolo || u.role || "").toString();
        const creato = u.created_at || u.createdAt || u.data_creazione;
        const dateStr = creato ? new Date(creato).toLocaleString("it-IT") : "—";

        $tb.append(`
            <tr data-id="${u.id ?? ""}">
              <td>${u.id ?? "—"}</td>
              <td>
                ${escapeHtml(u.nome || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—")}
                ${u.isBanned ? ' <span class="badge bg-danger ms-2">BANNATO</span>' : ""}
              </td>
              <td>${escapeHtml(u.email || "—")}</td>
              <td>${escapeHtml(ruolo || "—")}</td>
              <td>${dateStr}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary btn-edit-user me-1" data-id="${u.id ?? ""}" title="Modifica">
                  <i class="fa-regular fa-pen-to-square"></i>
                </button>
                ${u.isBanned
            ? `<button class="btn btn-sm btn-success btn-unban-user" data-id="${u.id ?? ""}" title="Sblocca">
                        <i class="fa-solid fa-unlock"></i>
                      </button>`
            : `<button class="btn btn-sm btn-danger btn-ban-user" data-id="${u.id ?? ""}" title="Blocca">
                        <i class="fa-solid fa-ban"></i>
                      </button>`
          }
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
              <label class="form-label">Nome e Cognome</label>
              <input type="text" class="form-control" id="ue-nome" required>
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
    const u = __usersCache.get(id);
    if (!u) return;

    $("#ue-id").val(id);
    $("#ue-nome").val(u.nome || u.first_name || "");
    $("#ue-email").val(u.email || "");
    $("#ue-telefono").val(u.telefono || u.numero_telefono || "");
    const dob = u.data_nascita ? String(u.data_nascita).slice(0, 10) : (u.dob ? String(u.dob).slice(0, 10) : "");
    $("#ue-dob").val(dob);

    new bootstrap.Modal(document.getElementById("modalUserEdit")).show();
  });

  // Submit modifica → PUT /users/updateInfo/:id
  $(document).on("submit", "#form-user-edit", async function (e) {
    e.preventDefault();

    const id = $("#ue-id").val();
    const before = __usersCache.get(String(id)) || {};

    const cur = {
      nome: $("#ue-nome").val().trim(),
      email: $("#ue-email").val().trim(),
      telefono: $("#ue-telefono").val().trim(),
      data_nascita: $("#ue-dob").val() || null
    };

    const payload = {};
    const addIfChanged = (key, newVal, oldVal) => {
      const oldNorm = (oldVal == null) ? "" : String(oldVal);
      const newNorm = (newVal == null) ? "" : String(newVal);
      if (newNorm !== "" && newNorm !== oldNorm) payload[key] = newVal;
    };

    addIfChanged("nome", cur.nome, before.nome || before.first_name);
    addIfChanged("email", cur.email, before.email);
    addIfChanged("numeroTelefono", cur.telefono, before.telefono || before.numero_telefono);
    addIfChanged("dataNascita", cur.data_nascita, before.data_nascita || before.dob);

    if (Object.keys(payload).length === 0) {
      bootstrap.Modal.getInstance(document.getElementById("modalUserEdit"))?.hide();
      toast("Nessuna modifica da salvare");
      return;
    }

    // disabilita pulsante mentre salva
    const $btn = $("#form-user-edit button[type='submit']");
    const oldHtml = $btn.html();
    $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm me-2"></span>Salvo...');

    try {
      await $.ajax({
        url: `${API_USERS}/updateInfo/${encodeURIComponent(id)}`,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(payload),
        headers: { Authorization: "Bearer " + token }
      });

      bootstrap.Modal.getInstance(document.getElementById("modalUserEdit"))?.hide();
      toast("Utente aggiornato");
      loadUsers();
    } catch (err) {
      console.error(err);
      const msg = err?.responseJSON?.error || err?.responseJSON?.message || "Errore nell'aggiornamento";
      toast(msg, false);
    } finally {
      $btn.prop("disabled", false).html(oldHtml);
    }
  });

  // BAN
  $(document).on("click", ".btn-ban-user", async function () {
    const id = String($(this).data("id") || "");
    if (!id) return;

    try {
      await $.ajax({
        url: `${API_USERS}/ban/${encodeURIComponent(id)}`,
        type: "PUT",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + token }
      });
      toast("Utente bannato");
      loadUsers();
    } catch (err) {
      console.error(err);
      const msg = err?.responseJSON?.error || err?.responseJSON?.message || "Errore nel ban";
      toast(msg, false);
    }
  });

  // UNBAN
  $(document).on("click", ".btn-unban-user", async function () {
    const id = String($(this).data("id") || "");
    if (!id) return;

    try {
      await $.ajax({
        url: `${API_USERS}/unban/${encodeURIComponent(id)}`,
        type: "PUT",
        headers: { Authorization: "Bearer " + token }
      });
      toast("Utente sbloccato");
      loadUsers();
    } catch (err) {
      console.error(err);
      const msg = err?.responseJSON?.error || err?.responseJSON?.message || "Errore nello sblocco";
      toast(msg, false);
    }
  });

  // SOFT DELETE sede
  $(document).on("click", ".btn-del-sede", async function () {
    const id = String($(this).data("id") || "");
    if (!id) return;

    const $btn = $(this);
    const oldHtml = $btn.html();
    $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm"></span>');

    try {
      await $.ajax({
        url: `${API_SEDI}/deleteSede/${encodeURIComponent(id)}`, // backend fa soft delete
        type: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
      toast("Sede eliminata");
      loadSedi();
      loadDashboard?.();
    } catch (err) {
      console.error(err);
      const msg = err?.responseJSON?.error || err?.responseJSON?.message || "Errore nell'eliminazione";
      toast(msg, false);
      $btn.prop("disabled", false).html(oldHtml);
    }
  });

  // SOFT DELETE spazio (attivo = false)
  $(document).on("click", ".btn-del-spazio", async function () {
    const id = String($(this).data("id") || "");
    if (!id) return;

    const $btn = $(this);
    const oldHtml = $btn.html();
    $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm"></span>');

    try {
      await $.ajax({
        url: `${API_SPAZI}/deleteSpazio/${encodeURIComponent(id)}`,
        type: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
      toast("Spazio disattivato");
      loadSpazi();
    } catch (err) {
      console.error(err);
      const msg = err?.responseJSON?.error || err?.responseJSON?.message || "Errore eliminazione spazio";
      toast(msg, false);
      $btn.prop("disabled", false).html(oldHtml);
    }
  });


  // SEDI 
  async function loadSedi() {
    const $tb = $("#tbl-sedi tbody").html(loadingRow(5));
    try {
      const sedi = (await get(`${API_SEDI}/getAllSedi`)) || [];
      if (!sedi.length) {
        $tb.html(`<tr><td colspan="5" class="text-muted text-center">Nessuna sede trovata.</td></tr>`);
        return;
      }

      $tb.empty();
      sedi.forEach(s => {
        const isActive = (s.attiva === true || s.attiva === 1 || String(s.attiva) === "true");

        $tb.append(`
          <tr>
            <td>${s.id ?? "—"}</td>
            <td>${escapeHtml(s.nome || "—")}</td>
            <td>${escapeHtml([s.indirizzo, s.citta].filter(Boolean).join(", ") || "—")}</td>
            <td class="text-end">
              ${isActive
            ? `
                    <button class="btn btn-sm btn-danger btn-del-sede" data-id="${s.id}" title="Elimina (soft)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  `
            : `
                    <button class="btn btn-sm btn-success btn-restore-sede" data-id="${s.id}" title="Ripristina">
                      <i class="fa-solid fa-rotate-left"></i>
                    </button>
                  `
          }
            </td>
          </tr>
        `);
      });
    } catch (e) {
      console.error(e);
      $tb.html(errorRow(5));
    }
  }

  // SPAZI 
  async function loadSpazi() {
    const $tb = $("#tbl-spazi tbody").html(loadingRow(6));
    try {
      const spazi = (await get(`${API_SPAZI}/getSpazi?all=1`)) || [];
      if (!spazi.length) {
        $tb.html(`<tr><td colspan="6" class="text-muted text-center">Nessuno spazio trovato.</td></tr>`);
        return;
      }

      $tb.empty();
      spazi.forEach(sp => {
        const tipologia = (sp.tipologia || "").replaceAll("_", " ").replace(/^\w/, c => c.toUpperCase());

        $tb.append(`
          <tr>
            <td>${sp.id ?? "—"}</td>
            <td>${escapeHtml(sp.nome || "—")}</td>
            <td>${escapeHtml(tipologia || "—")}</td>
            <td>${sp.id_sede ?? "—"}</td>
            <td class="text-end">
              <div class="btn-group">
                <a class="btn btn-sm btn-outline-primary" href="spazio.html?id=${sp.id ?? ""}" title="Dettagli">
                  <i class="fa-solid fa-circle-info"></i>
                </a>
                <button class="btn btn-sm btn-danger btn-del-spazio" data-id="${sp.id}" title="Elimina (soft)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
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
      const url = sedeId
        ? `${API_PREN}/getAllPrenotazioni?sede=${encodeURIComponent(sedeId)}`
        : `${API_PREN}/getAllPrenotazioni`;

      const pren = await get(url);

      if (!pren?.length) {
        $tb.html(`<tr><td colspan="8" class="text-muted text-center">Nessuna prenotazione.</td></tr>`);
        return;
      }

      // ordina per data/creazione desc
      pren.sort((a, b) => (new Date(pickPrenDate(b) || 0)) - (new Date(pickPrenDate(a) || 0)));

      $tb.empty();
      pren.forEach(p => {
        const sedeName = p.sede_nome || `Sede #${p.id_sede ?? "—"}`;
        const cliente = p.utente_nome || `Utente #${p.id_utente ?? "—"}`;
        const stato = p.stato || "—";
        const badge = getStatusBadge(stato);
        const totale = (p.importo ?? p.totale) != null ? parseFloat(p.importo ?? p.totale).toFixed(2) : "—";
        const d = pickPrenDate(p);
        const dateStr = d ? d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

        $tb.append(`
        <tr>
          <td>${p.id ?? "—"}</td>
          <td>${p.id_sede ?? "—"}</td>
          <td>${escapeHtml(sedeName)}</td>
          <td>${escapeHtml(cliente)}</td>
          <td><span class="badge ${badge}">${escapeHtml(stato)}</span></td>
          <td>€${totale}</td>
          <td>${dateStr}</td>
          <td class="text-end">
            <a class="btn btn-sm btn-outline-primary" href="spazio.html?id=${p.spazio_id ?? ""}" title="Vai allo spazio">
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
    try {
      return await get(`${API_PREN}/getAllPrenotazioni`);
    } catch {
      return [];
    }
  }

  // Avvii iniziali 
  // Carica dashboard subito
  await loadDashboard();

  const initialTarget = (location.hash || "").replace("#", "");
  if (initialTarget) {
    $(`.profile-nav .nav-item[data-target="${initialTarget}"]`).trigger("click");
  }

});
