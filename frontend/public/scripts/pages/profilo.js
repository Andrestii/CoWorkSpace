// scripts/pages/profilo.js
$(document).ready(function () {
  const token = localStorage.getItem("authToken");
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  if (!token) { window.location.href = "login.html"; return; }

  // ====== API roots ======
  const API_ROOT = apiConfig.apiUrl;
  const API_USERS = `${API_ROOT}/users`;
  const API_SEDI = `${API_ROOT}/sedi`;
  const API_SPAZI = `${API_ROOT}/spazi`;
  const API_PREN = `${API_ROOT}/prenotazioni`;
  const API_DISP = `${API_ROOT}/disponibilita`;

  // ====== Supabase (avatar) ======
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

  // ====== Stato modalità Admin ======
  let ADMIN_MODE = false; // quando true, le liste usano endpoint "globali"

  // ====== Bootstrap utente ======
  fetchMe()
    .then(user => {
      if (!user?.id) { window.location.href = "login.html"; return; }
      window.__uid__ = user.id;

      // Header
      $("#user-name").text(user.nome || "Utente");
      $("#user-email").text(user.email || "");
      const ruolo = String(user.ruolo || "").toLowerCase();
      $("#user-role").text(ruolo.toUpperCase());

      // Avatar
      const avatar = user.profileImageUrl || (user.profile_image ? supaPublicUrl(user.profile_image) : null);
      setImg($("#profile-image"), avatar);

      // ✅ Riempie il form con i dati dal DB
      fillProfileForm(user);

      // Menu per ruolo
      buildRoleMenu(ruolo);

      // Precarico sezioni base solo se NON admin
      if (ruolo !== "admin") {
        loadUserBookings();
      }

      // Solo GESTORE carica le sezioni gestionali
      if (ruolo === "gestore") {
        renderKpiSkeleton();
        loadMieSedi();
        loadMieiSpazi();
        loadPrenGestore();
        initDisponibilitaUI();
        loadSpaziGestore();
      }
    })
    .catch(() => window.location.href = "login.html");

  function fetchMe() {
    return $.ajax({
      url: `${API_USERS}/me`,
      type: "GET",
      headers: { Authorization: "Bearer " + token }
    }).catch(() => userData); // fallback localStorage
  }

  // ====== Sidebar switching ======
  $(document).on("click", ".profile-nav .nav-item", function () {
    const target = $(this).data("target");
    if (!target) return;

    $(".profile-nav .nav-item").removeClass("active");
    $(this).addClass("active");

    $(".content-section").removeClass("active").hide();
    $(`#${target}`).addClass("active").show();

    // ricarichi leggeri on-demand
    switch (target) {
      case "prenotazioni": loadUserBookings(); break;
      case "mie-sedi": loadMieSedi(); break;
      case "miei-spazi": loadMieiSpazi(); break;
      case "prenotazioni-gestore": loadPrenGestore(); break;
      case "disponibilita": loadSpaziGestore(); break;
      case "dash-gestore": loadPrenGestore({ forDashboard: true, limit: 50 }); break;
      case "admin-mode":    /* niente, è solo info + scorciatoie */ break;
    }
  });

  // pulsanti "Vai alla lista" ecc.
  $(document).on("click", "[data-open]", function (e) {
    e.preventDefault();
    const t = $(this).data("open");
    $(`.profile-nav .nav-item[data-target="${t}"]`).trigger("click");
  });

  // ====== Edit info ======
  $("#edit-info-btn").on("click", function () {
    $("#info-personali input").prop("readonly", false);
    $("#cancel-edit, #save-profile").removeClass("d-none");
    $(this).prop("disabled", true);
  });

  $("#cancel-edit").on("click", function () {
    fetchMe().then(u => {
      $("#nome").val(u.nome || "");
      $("#cognome").val(u.cognome || "");
      $("#email").val(u.email || "");
      $("#telefono").val(u.telefono || "");
      $("#data-nascita").val(u.data_nascita ? String(u.data_nascita).slice(0, 10) : "");
      const url = u.profileImageUrl || (u.profile_image ? supaPublicUrl(u.profile_image) : null);
      setImg($("#profile-image"), url);
    });
    $("#info-personali input").prop("readonly", true);
    $("#cancel-edit, #save-profile").addClass("d-none");
    $("#edit-info-btn").prop("disabled", false);
  });

  $("#profile-form").on("submit", function (e) {
    e.preventDefault();
    const payload = {
      nome: $("#nome").val().trim(),
      cognome: $("#cognome").val().trim(),
      email: $("#email").val().trim(),
      telefono: $("#telefono").val().trim(),
      data_nascita: $("#data-nascita").val() || null
    };
    $.ajax({
      url: `${API_USERS}/profile`,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify(payload),
      headers: { Authorization: "Bearer " + token }
    })
      .done(u => {
        $("#info-personali input").prop("readonly", true);
        $("#cancel-edit, #save-profile").addClass("d-none");
        $("#edit-info-btn").prop("disabled", false);
        $("#user-name").text(u.nome || "Utente");
        $("#user-email").text(u.email || "");
        const url = u.profileImageUrl || (u.profile_image ? supaPublicUrl(u.profile_image) : null);
        if (url) setImg($("#profile-image"), url);
      })
      .fail(xhr => alert(xhr?.responseJSON?.error || "Errore durante l'aggiornamento del profilo"));
  });

  // ====== Upload avatar ======
  $("#avatar-edit-btn").on("click", () => $("#avatar-upload").trigger("click"));
  $("#avatar-upload").on("change", function () {
    const f = this.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("profileImage", f);
    $.ajax({
      url: `${API_USERS}/profile-image`,
      type: "POST",
      data: fd, processData: false, contentType: false,
      headers: { Authorization: "Bearer " + token }
    })
      .done(u => {
        const url = u.profileImageUrl || (u.profile_image ? supaPublicUrl(u.profile_image) : null);
        setImg($("#profile-image"), url);
      })
      .fail(xhr => alert(xhr?.responseJSON?.error || "Errore nel caricamento dell'immagine"));
  });

  // ====== Logout locale (safe: esiste solo se lasciato in DOM) ======
  if ($("#logout-btn").length) {
    $("#logout-btn").on("click", function () {
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    });
  }

  // =================================
  // CLIENTE: Le mie prenotazioni
  // =================================
  function loadUserBookings() {
    const $c = $("#prenotazioni").html(loadingState("Caricamento prenotazioni..."));
    $.ajax({
      url: `${API_PREN}/getMiePrenotazioni`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
      .done(rows => renderBookingsList(rows || [], $c))
      .fail(() => $c.html(errorState("Errore nel caricamento delle prenotazioni.")));
  }

  function renderBookingsList(rows, $c) {
    $c.empty();
    if (!rows.length) {
      updateBadge("prenotazioni", 0);
      $c.html('<p class="text-muted text-center">Non hai ancora effettuato prenotazioni.</p>');
      return;
    }
    updateBadge("prenotazioni", rows.length);

    rows.forEach(b => {
      const d = b.created_at ? new Date(b.created_at) : null;
      const dateStr = d ? d.toLocaleString("it-IT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
      const stato = b.stato || "Sconosciuto";
      const badge = getStatusBadge(stato);
      const tot = (b.totale != null) ? parseFloat(b.totale).toFixed(2) : "0.00";
      const sedeNome = b?.sede?.nome || b?.spazio_nome || "Sede";

      $c.append(`
        <div class="booking-item">
          <div class="booking-header">
            <div class="booking-id">Prenotazione #${String(b.id || "").slice(0, 8)}...</div>
            <div class="booking-date">${dateStr}</div>
            <div class="booking-status"><span class="badge ${badge}">${stato}</span></div>
          </div>
          <div class="booking-details">
            <div class="booking-entry">
              <img src="${b?.sede?.immagine || ""}" class="booking-image" alt="sede">
              <div class="booking-info">
                <h6>${escapeHtml(sedeNome)} - ${b?.tipo || "Postazione"}</h6>
                <p class="text-muted mb-0">Durata: ${b?.durata || "N/D"} ore</p>
              </div>
            </div>
          </div>
          <div class="booking-footer">
            <div class="booking-total">Totale: <span class="fw-bold text-primary">€${tot}</span></div>
            <div class="booking-actions">
              <a href="sede.html?id=${b.id_spazio || b.id_sede || ''}" class="btn btn-sm btn-outline-primary">Dettagli sede</a>
            </div>
          </div>
        </div>
      `);
    });
  }

  // ==========================================================
  // GESTORE/ADMIN: Le mie (o tutte) SEDI
  // ==========================================================
  function ensureSediModal() {
    if (!$(".content-section#mie-sedi .content-header .btn-new-sede").length) {
      $(".content-section#mie-sedi .content-header").append(`
        <button class="btn btn-sm btn-primary ms-2 btn-new-sede">
          <i class="fa-regular fa-plus me-1"></i> Nuova sede
        </button>
      `);
    }
    if (!$("#modalSede").length) {
      $("body").append(`
      <div class="modal fade" id="modalSede" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <form class="modal-content" id="form-sede" enctype="multipart/form-data">
            <div class="modal-header">
              <h5 class="modal-title" id="modalSedeTitle">Nuova sede</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
            </div>
            <div class="modal-body">
              <input type="hidden" id="sede-id">
              <div class="row g-3">
                <div class="col-md-6"><label class="form-label">Nome</label><input type="text" class="form-control" id="sede-nome" required></div>
                <div class="col-md-6"><label class="form-label">Città</label><input type="text" class="form-control" id="sede-citta"></div>
                <div class="col-md-8"><label class="form-label">Indirizzo</label><input type="text" class="form-control" id="sede-indirizzo"></div>
                <div class="col-md-4"><label class="form-label d-block">Attiva</label><input type="checkbox" id="sede-attivo" class="form-check-input"></div>
                <div class="col-12"><label class="form-label">Descrizione</label><textarea id="sede-descrizione" class="form-control" rows="3"></textarea></div>
                <div class="col-12"><label class="form-label">Immagine (opzionale)</label><input type="file" id="sede-immagine" class="form-control" accept="image/*"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Annulla</button>
              <button class="btn btn-primary" type="submit" id="sede-submit">Salva</button>
            </div>
          </form>
        </div>
      </div>`);
    }
  }

  // carica sedi (mie oppure tutte se ADMIN_MODE)
  function loadMieSedi() {
    const $grid = $("#mie-sedi-grid").empty().append('<div class="text-muted">Caricamento sedi...</div>');
    const url = ADMIN_MODE ? `${API_SEDI}/getSedi` : `${API_SEDI}/mie`;

    $.ajax({ url, type: "GET", headers: { Authorization: "Bearer " + token } })
      .done(mie => {
        $grid.empty();
        const sedi = Array.isArray(mie) ? mie : [];
        updateBadge("mie-sedi", sedi.length);
        if (!sedi.length) { $grid.html('<p class="text-muted">Nessuna sede trovata.</p>'); return; }

        sedi.forEach(s => {
          const img = s.immagine || 'https://via.placeholder.com/800x500?text=Sede';
          const sedeId = s.id;
          $grid.append(`
            <div class="col-md-6 col-xl-4">
              <div class="card h-100 shadow-sm prodotto-card">
                <img class="card-img-top" src="${img}" alt="${escapeHtml(s.nome || "Sede")}">
                <div class="card-body">
                  <h5 class="card-title">${escapeHtml(s.nome || "Sede")}</h5>
                  <p class="card-text text-muted">${escapeHtml([s.indirizzo, s.citta].filter(Boolean).join(", "))}</p>
                  <div class="d-flex gap-2">
                    <a class="btn btn-sm btn-outline-primary" href="sede.html?id=${sedeId}">
                      <i class="fa-solid fa-circle-info me-1"></i> Dettagli sede
                    </a>
                  </div>
                  <div id="spazi-sede-${sedeId}" class="collapse mt-3">
                    <div class="spazi-wrapper border rounded p-2"><div class="text-muted">Carica gli spazi…</div></div>
                  </div>
                </div>
              </div>
            </div>`);
        });
      })
      .fail(() => $grid.html(errorState("Errore nel caricamento delle sedi.")));
  }

  function fetchSpaziBySede(sedeId) {
    return $.ajax({
      url: `${API_SPAZI}/getSpazi?sede=${encodeURIComponent(sedeId)}`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    }).then(list => list || []).catch(() => []);
  }

  function renderSpaziInCard(sedeId, spazi) {
    const $wrap = $(`#spazi-sede-${sedeId} .spazi-wrapper`).empty();
    if (!spazi.length) { $wrap.html('<div class="text-muted">Nessuno spazio per questa sede.</div>'); return; }
    spazi.forEach(sp => {
      const img = sp.immagine || 'https://via.placeholder.com/600x400?text=Spazio';
      $wrap.append(`
        <div class="d-flex align-items-center p-2 border rounded mb-2">
          <img src="${img}" style="width:86px;height:64px;object-fit:cover" class="me-2 rounded" alt="">
          <div class="flex-grow-1">
            <div class="fw-semibold">${escapeHtml(sp.nome || "Spazio")}</div>
            <div class="text-muted small">${escapeHtml((sp.tipologia || "").replaceAll("_", " ").replace(/^\w/, c => c.toUpperCase()))}</div>
          </div>
          <a href="spazio.html?id=${sp.id}" class="btn btn-sm btn-outline-primary">Dettagli</a>
        </div>`);
    });
  }

  // ==========================================================
  // GESTORE/ADMIN: I miei (o tutti) SPAZI
  // ==========================================================
  function loadMieiSpazi() {
    const $g = $("#miei-spazi-grid").html('<div class="text-muted">Caricamento spazi...</div>');
    // gestore: prendo sedi mie e filtro; admin: prendo tutti gli spazi
    const fetchAllSpazi = () => $.ajax({ url: `${API_SPAZI}/getSpazi`, type: "GET", headers: { Authorization: "Bearer " + token } });

    if (ADMIN_MODE) {
      fetchAllSpazi()
        .done(spazi => renderSpaziGrid($g, spazi || []))
        .fail(() => $g.html(errorState("Errore nel caricamento degli spazi.")));
    } else {
      // sedi del gestore -> filtra spazi per id_sede
      $.ajax({ url: `${API_SEDI}/mie`, type: "GET", headers: { Authorization: "Bearer " + token } })
        .done(mieSedi => {
          const ids = (mieSedi || []).map(s => s.id);
          fetchAllSpazi()
            .done(spazi => renderSpaziGrid($g, (spazi || []).filter(sp => ids.includes(sp.id_sede))))
            .fail(() => $g.html(errorState("Errore nel caricamento degli spazi.")));
        })
        .fail(() => $g.html(errorState("Errore nel caricamento delle sedi.")));
    }
  }

  function renderSpaziGrid($g, spazi) {
    $g.empty();
    updateBadge("miei-spazi", spazi.length);
    if (!spazi.length) { $g.html('<p class="text-muted">Nessuno spazio trovato.</p>'); return; }
    spazi.forEach(sp => {
      const img = sp.immagine || 'https://via.placeholder.com/800x500?text=Spazio';
      $g.append(`
        <div class="col-md-6 col-xl-4">
          <div class="card h-100 shadow-sm">
            <img src="${img}" class="card-img-top" style="aspect-ratio:4/3;object-fit:cover" alt="">
            <div class="card-body">
              <h5 class="card-title mb-1">${escapeHtml(sp.nome || "Spazio")}</h5>
              <div class="text-muted small mb-2">${escapeHtml((sp.tipologia || "").replaceAll("_", " ").replace(/^\w/, c => c.toUpperCase()))}</div>
              <a class="btn btn-sm btn-outline-primary" href="spazio.html?id=${sp.id}">
                <i class="fa-solid fa-circle-info me-1"></i> Dettagli
              </a>
            </div>
          </div>
        </div>`);
    });
  }

  // ==========================================================
  // GESTORE/ADMIN: Prenotazioni ricevute
  // ==========================================================
  function loadPrenGestore({ limit = 50, forDashboard = false } = {}) {
    const $tbl = $("#tab-pren-gestore tbody");
    if (!forDashboard) $tbl.html(`<tr><td colspan="7" class="text-muted">Caricamento...</td></tr>`);

    // 1) prendi le SEDI del gestore
    $.ajax({
      url: `${API_SEDI}/mie`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
      .done(async (mieSedi) => {
        if (!mieSedi?.length) {
          if (forDashboard) { renderKpiFromBookings([]); renderUltimePren([]); }
          else { $tbl.html(`<tr><td colspan="7" class="text-muted">Nessuna prenotazione trovata.</td></tr>`); updateBadge("prenotazioni-gestore", 0); }
          return;
        }

        // 2) per ogni Sede → prendo gli SPAZI di quella sede
        const spaziPerSede = await Promise.all(
          mieSedi.map(sede =>
            $.ajax({
              url: `${API_SPAZI}/getSpazi?sede=${encodeURIComponent(sede.id)}`,
              type: "GET",
              headers: { Authorization: "Bearer " + token }
            })
              .then(list => (list || []).map(sp => ({ sede, spazio: sp })))
              .catch(() => [])
          )
        );

        const coppie = spaziPerSede.flat(); // [{sede, spazio}, ...]
        if (!coppie.length) {
          if (forDashboard) { renderKpiFromBookings([]); renderUltimePren([]); }
          else { $tbl.html(`<tr><td colspan="7" class="text-muted">Non hai spazi su cui ricevere prenotazioni.</td></tr>`); updateBadge("prenotazioni-gestore", 0); }
          return;
        }

        // 3) per ogni SPAZIO → prendo le prenotazioni di quello spazio
        const prenPromises = coppie.map(({ sede, spazio }) =>
          $.ajax({
            url: `${API_PREN}/getPrenotazioniSpazio/${spazio.id}`,  // ✅ usa id_spazio
            type: "GET",
            headers: { Authorization: "Bearer " + token }
          })
            .then(rows => (rows || []).map(p => ({ ...p, _sede: sede, _spazio: spazio })))
            .catch(() => [])
        );

        const results = await Promise.all(prenPromises);
        let rows = results.flat();

        // 4) ordino e limito (per dashboard)
        rows.sort((a, b) => {
          const da = new Date(a.data_creazione || `${a.data}T${a.ora_inizio || "00:00"}`).getTime();
          const db = new Date(b.data_creazione || `${b.data}T${b.ora_inizio || "00:00"}`).getTime();
          return db - da;
        });
        if (forDashboard && limit) rows = rows.slice(0, limit);

        if (forDashboard) { renderKpiFromBookings(rows); renderUltimePren(rows); }
        else { renderPrenGestoreTable(rows); updateBadge("prenotazioni-gestore", rows.length); }
      })
      .fail(() => {
        if (!forDashboard) $tbl.html(`<tr><td colspan="7" class="text-danger">Errore nel caricamento.</td></tr>`);
      });
  }

  function formatTime(timeStr) {
    if (!timeStr) return "-";
    return timeStr.slice(0, 5); // prende solo HH:MM
  }

  function renderPrenGestoreTable(rows) {
    const $tbl = $("#tab-pren-gestore tbody").empty();
    if (!rows.length) {
      $tbl.html(`<tr><td colspan="7" class="text-muted">Nessuna prenotazione trovata.</td></tr>`);
      return;
    }

    rows.forEach((r, i) => {
      const data = r.data ? new Date(r.data).toLocaleDateString("it-IT") : "-";
      const orario = `${formatTime(r.ora_inizio)}–${formatTime(r.ora_fine)}`;
      const stato = r.stato || "—";
      const badge = getStatusBadge(stato);
      const sede = r._sede?.nome || "—";
      const cliente = r.utente?.nome || `Utente #${r.id_utente}`;
      const tot = (r.importo != null) ? parseFloat(r.importo).toFixed(2) : "—";

      $tbl.append(`
      <tr>
        <td>${i + 1}</td>
        <td>${data}</td>
        <td>${escapeHtml(sede)}</td>
        <td>${escapeHtml(cliente)}</td>
        <td>${escapeHtml(orario)}</td>
        <td>€${tot}</td>
        <td><span class="badge ${badge}">${stato}</span></td>
      </tr>
    `);
    });
  }

  // ====== KPI & Dashboard ======
  function renderKpiSkeleton() { $("#kpi-ogg, #kpi-week, #kpi-month").text("—"); $("#dash-ultime").html(`<div class="text-muted">Caricamento...</div>`); }

  function renderKpiFromBookings(rows) {
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let cToday = 0, cWeek = 0, cMonth = 0;

    (rows || []).forEach(r => {
      const d = r.data_creazione
        ? new Date(r.data_creazione)
        : (r.data ? new Date(`${r.data}T${r.ora_inizio || "00:00"}`) : null);
      if (!d) return;
      if (sameDate(d, now)) cToday++;
      if (d >= startOfWeek) cWeek++;
      if (d >= startOfMonth) cMonth++;
    });

    $("#kpi-ogg").text(cToday);
    $("#kpi-week").text(cWeek);
    $("#kpi-month").text(cMonth);
  }

  function renderUltimePren(rows) {
    const list = (rows || []).slice(0, 5);
    if (!list.length) { $("#dash-ultime").html(`<p class="text-muted mb-0">Nessuna prenotazione recente.</p>`); return; }

    const html = list.map(r => {
      const d = r.data_creazione
        ? new Date(r.data_creazione)
        : (r.data ? new Date(`${r.data}T${r.ora_inizio || "00:00"}`) : null);
      const data = d ? d.toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";
      const sede = r._sede?.nome || "—";
      const stato = r.stato || "—";
      const badge = getStatusBadge(stato);
      return `
      <div class="d-flex align-items-center py-2 border-bottom">
        <div class="flex-grow-1">
          <div class="fw-semibold">${escapeHtml(sede)}</div>
          <div class="text-muted small">${data}</div>
        </div>
        <span class="badge ${badge}">${stato}</span>
      </div>`;
    }).join("");

    $("#dash-ultime").html(html);
  }

  // =================================================
  // GESTORE/ADMIN: DISPONIBILITÀ
  // =================================================
  function initDisponibilitaUI() {
    if (!$("#disp-spazi-list").length) {
      $("#disponibilita .content-body").html(`<div class="row g-3" id="disp-spazi-list"></div>`);
    }
    // (modali create/update/toggle già iniettate nel codice originale)
    if (!$("#modalDisp").length) {
      $("body").append(`
      <div class="modal fade" id="modalDisp" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <form class="modal-content" id="form-disp">
            <div class="modal-header">
              <h5 class="modal-title" id="modalDispTitle">Nuova disponibilità</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
            </div>
            <div class="modal-body">
              <input type="hidden" id="disp-id">
              <input type="hidden" id="disp-spazio-id">
              <div class="mb-3"><label class="form-label">Data</label><input type="date" class="form-control" id="disp-data" required></div>
              <div class="row g-2">
                <div class="col"><label class="form-label">Ora inizio</label><input type="time" class="form-control" id="disp-ora-inizio" required></div>
                <div class="col"><label class="form-label">Ora fine</label><input type="time" class="form-control" id="disp-ora-fine" required></div>
              </div>
              <div class="form-check mt-3"><input class="form-check-input" type="checkbox" id="disp-chiuso"><label class="form-check-label" for="disp-chiuso">Giorno chiuso (non prenotabile)</label></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Annulla</button>
              <button class="btn btn-primary" type="submit" id="disp-submit">Salva</button>
            </div>
          </form>
        </div>
      </div>`);
    }
    if (!$("#modalToggleDate").length) {
      $("body").append(`
      <div class="modal fade" id="modalToggleDate" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <form class="modal-content" id="form-toggle-date">
            <div class="modal-header">
              <h5 class="modal-title" id="toggleDateTitle">Imposta stato data</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
            </div>
            <div class="modal-body">
              <input type="hidden" id="tg-spazio-id">
              <input type="hidden" id="tg-action">
              <div class="mb-3"><label class="form-label">Seleziona la data</label><input type="date" class="form-control" id="tg-date" required></div>
              <p class="small text-muted mb-0" id="tg-help"></p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Annulla</button>
              <button class="btn btn-primary" type="submit" id="tg-submit">Conferma</button>
            </div>
          </form>
        </div>
      </div>`);
    }
  }

  function loadSpaziGestore() {
    const $list = $("#disp-spazi-list").html('<div class="text-muted">Caricamento spazi...</div>');

    const fetchSedi = ADMIN_MODE ? $.ajax({ url: `${API_SEDI}/getSedi`, type: "GET", headers: { Authorization: "Bearer " + token } })
      : $.ajax({ url: `${API_SEDI}/mie`, type: "GET", headers: { Authorization: "Bearer " + token } });

    fetchSedi
      .done(sedi => {
        const ids = (sedi || []).map(s => s.id);
        $.ajax({ url: `${API_SPAZI}/getSpazi`, type: "GET", headers: { Authorization: "Bearer " + token } })
          .done(spazi => {
            const list = ADMIN_MODE ? (spazi || []) : (spazi || []).filter(sp => ids.includes(sp.id_sede));
            if (!list.length) { $list.html('<div class="col-12 text-muted">Nessuno spazio.</div>'); return; }
            $list.empty();
            list.forEach(sp => {
              const card = $(renderSpazioDispCard(sp));
              $list.append(card);
              loadDisponibilitaSpazio(sp.id);
            });
          })
          .fail(() => $list.html('<div class="col-12 text-danger">Errore nel caricamento degli spazi.</div>'));
      })
      .fail(() => $list.html('<div class="col-12 text-danger">Errore nel caricamento delle sedi.</div>'));
  }

  function renderSpazioDispCard(sp) {
    const img = sp.immagine || 'https://via.placeholder.com/800x500?text=Spazio';
    return `
    <div class="col-md-6">
      <div class="card h-100 shadow-sm">
        <img src="${img}" class="card-img-top" alt="${escapeHtml(sp.nome || "Spazio")}" style="aspect-ratio:4/3;object-fit:cover">
        <div class="card-body">
          <div class="d-flex flex-wrap gap-2 justify-content-between align-items-start">
            <div>
              <h5 class="card-title mb-1">${escapeHtml(sp.nome || "Spazio")}</h5>
              <div class="small text-muted">${escapeHtml([sp.indirizzo, sp.citta].filter(Boolean).join(", ") || "")}</div>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-sm btn-outline-dark btn-new-disp" data-spazio="${sp.id}">
                <i class="fa-regular fa-plus me-1"></i> Nuova disponibilità
              </button>
              <button class="btn btn-sm btn-outline-danger btn-close-date" data-spazio="${sp.id}">
                <i class="fa-regular fa-calendar-xmark me-1"></i> Disattiva data
              </button>
              <button class="btn btn-sm btn-outline-success btn-open-date" data-spazio="${sp.id}">
                <i class="fa-regular fa-calendar-check me-1"></i> Attiva data
              </button>
            </div>
          </div>
          <div class="mt-3">
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead><tr><th>Data</th><th>Inizio</th><th>Fine</th><th>Chiuso</th><th class="text-end">Azioni</th></tr></thead>
                <tbody id="disp-tbody-${sp.id}"><tr><td colspan="5" class="text-muted">Caricamento...</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // Carica disponibilità (usa /disponibilita/list e filtra per id_spazio)
  function loadDisponibilitaSpazio(spazioId) {
    const $tb = $(`#disp-tbody-${spazioId}`);
    if (!$tb.length) return;

    $.ajax({
      url: apiConfig.apiUrl + "/disponibilita/list?id_spazio=" + encodeURIComponent(spazioId),
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
      .done(rows => {
        // Filtro solo disponibilità relative a questo spazio
        const list = (rows || []).filter(
          x => String(x.id_spazio) === String(spazioId)
        );

        $tb.empty();
        if (!list.length) {
          $tb.html(`<tr><td colspan="5" class="text-muted">Nessuna disponibilità definita.</td></tr>`);
          return;
        }

        // Ordina per data inizio
        list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));

        list.forEach(d => {
          const id = d.id;
          const start = d.start_at ? new Date(d.start_at) : null;
          const end = d.end_at ? new Date(d.end_at) : null;
          const closed = d.disponibile === false; // se disponibile = false → chiuso

          $tb.append(`
          <tr data-id="${id}">
            <td>${start ? start.toLocaleDateString("it-IT") : "-"}</td>
            <td>${start ? start.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
            <td>${end ? end.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
            <td>${closed ? '<span class="badge bg-danger">Sì</span>' : '<span class="badge bg-success">No</span>'}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-dark btn-edit-disp" data-id="${id}" data-spazio="${spazioId}">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger btn-del-disp ms-1" data-id="${id}" data-spazio="${spazioId}">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `);
        });
      })
      .fail(() => {
        $tb.html(`<tr><td colspan="5" class="text-danger">Errore nel caricamento.</td></tr>`);
      });
  }

  // ====== Create/Update/Delete disponibilità (come nel tuo codice originale) ======
  $(document).on("click", ".btn-new-disp", function () {
    const spazioId = $(this).data("spazio");
    $("#modalDispTitle").text("Nuova disponibilità");
    $("#disp-id").val(""); $("#disp-spazio-id").val(spazioId);
    $("#disp-data").val(""); $("#disp-ora-inizio").val(""); $("#disp-ora-fine").val(""); $("#disp-chiuso").prop("checked", false);
    new bootstrap.Modal(document.getElementById("modalDisp")).show();
  });

  $(document).on("click", ".btn-edit-disp", function () {
    const id = $(this).data("id"); const spazioId = $(this).data("spazio");
    const $tr = $(`#disp-tbody-${spazioId} tr[data-id="${id}"]`);
    $("#modalDispTitle").text("Modifica disponibilità");
    $("#disp-id").val(id); $("#disp-spazio-id").val(spazioId);
    $("#disp-data").val($tr.find("td").eq(0).text().trim());
    $("#disp-ora-inizio").val($tr.find("td").eq(1).text().trim().replace("-", ""));
    $("#disp-ora-fine").val($tr.find("td").eq(2).text().trim().replace("-", ""));
    $("#disp-chiuso").prop("checked", $tr.find("td").eq(3).text().includes("Sì"));
    new bootstrap.Modal(document.getElementById("modalDisp")).show();
  });

  $(document).on("submit", "#form-disp", function (e) {
    e.preventDefault();
    const id = $("#disp-id").val();
    const spazioId = $("#disp-spazio-id").val();
    const payload = {
      id_spazio: Number(spazioId),
      data: $("#disp-data").val(),
      ora_inizio: $("#disp-ora-inizio").val(),
      ora_fine: $("#disp-ora-fine").val(),
      closed: $("#disp-chiuso").is(":checked")
    };
    if (!payload.data) { alert("Seleziona una data"); return; }
    const opts = { headers: { Authorization: "Bearer " + token }, contentType: "application/json", data: JSON.stringify(payload) };
    const req = id ? $.ajax({ url: `${API_DISP}/update/${id}`, type: "PUT", ...opts })
      : $.ajax({ url: `${API_DISP}/create`, type: "POST", ...opts });
    req.done(() => { toastOk("Salvato"); bootstrap.Modal.getInstance(document.getElementById("modalDisp"))?.hide(); loadDisponibilitaSpazio(spazioId); })
      .fail(() => toastErr("Errore nel salvataggio"));
  });

  $(document).on("click", ".btn-del-disp", function () {
    const id = $(this).data("id"); const spazioId = $(this).data("spazio");
    if (!confirm("Eliminare questa disponibilità?")) return;
    $.ajax({ url: `${API_DISP}/delete/${id}`, type: "DELETE", headers: { Authorization: "Bearer " + token } })
      .done(() => { toastOk("Eliminata"); loadDisponibilitaSpazio(spazioId); })
      .fail(() => toastErr("Errore nell'eliminazione"));
  });

  // ====== Attiva/Disattiva data ======
  $(document).on("click", ".btn-close-date, .btn-open-date", function () {
    const spazioId = $(this).data("spazio");
    const action = $(this).hasClass("btn-close-date") ? "close" : "open";
    if (!$("#modalToggleDate").length) return;
    $("#tg-spazio-id").val(spazioId);
    $("#tg-action").val(action);
    $("#tg-date").val("");
    $("#toggleDateTitle").text(action === "close" ? "Disattiva data" : "Attiva data");
    $("#tg-help").text(action === "close" ? "La data selezionata sarà non prenotabile." : "La data selezionata sarà resa prenotabile.");
    new bootstrap.Modal(document.getElementById("modalToggleDate")).show();
  });

  $(document).on("submit", "#form-toggle-date", async function (e) {
    e.preventDefault();
    const spazioId = $("#tg-spazio-id").val();
    const action = $("#tg-action").val();
    const date = $("#tg-date").val();
    if (!date) { alert("Seleziona una data"); return; }
    try {
      await upsertToggleDate(spazioId, date, action === "close");
      toastOk(action === "close" ? "Data disattivata" : "Data attivata");
      bootstrap.Modal.getInstance(document.getElementById("modalToggleDate"))?.hide();
      loadDisponibilitaSpazio(spazioId);
    } catch { toastErr("Operazione non riuscita"); }
  });

  async function upsertToggleDate(spazioId, date, closed) {
    const list = await $.ajax({ url: `${API_DISP}/list`, type: "GET", headers: { Authorization: "Bearer " + token } });
    const sameDay = (d1, d2) => String(d1).slice(0, 10) === String(d2).slice(0, 10);
    const existing = (list || []).find(x => String(x.id_spazio || x.spazio_id) === String(spazioId) && sameDay(x.data, date));
    const payload = { id_spazio: Number(spazioId), data: date, ora_inizio: "00:00", ora_fine: "23:59", closed: !!closed };
    const opts = { headers: { Authorization: "Bearer " + token }, contentType: "application/json", data: JSON.stringify(payload) };
    if (existing?.id) return $.ajax({ url: `${API_DISP}/update/${existing.id}`, type: "PUT", ...opts });
    return $.ajax({ url: `${API_DISP}/create`, type: "POST", ...opts });
  }

  function buildRoleMenu(ruolo) {
    const isGestore = ruolo === "gestore";
    const isAdmin = ruolo === "admin";

    // reset: nascondo voci gestore/admin
    $(".nav-gestore, .nav-admin").addClass("d-none");

    if (isGestore) {
      $(".nav-gestore").removeClass("d-none");
    }

    if (isAdmin) {
      // Admin: nascondi tutto tranne INFO PERSONALI
      $(`.profile-nav .nav-item[data-target="prenotazioni"]`).addClass("d-none");
      $(".nav-gestore").addClass("d-none");
      $(".nav-admin").addClass("d-none");

      // Nascondi anche le sezioni contenuto non necessarie
      $("#prenotazioni, #mie-sedi, #miei-spazi, #prenotazioni-gestore, #disponibilita, #dash-gestore").remove();
    }
  }

  function fillProfileForm(user) {
    // Popola i campi del form con i dati ricevuti dal backend
    $("#nome").val(user.nome || "");
    $("#email").val(user.email || "");
    $("#telefono").val(user.numero_telefono || "");
    $("#data-nascita").val(user.data_nascita ? String(user.data_nascita).slice(0, 10) : "");

    // Se hai anche la descrizione nel form
    if ($("#descrizione").length) {
      $("#descrizione").val(user.descrizione || "");
    }
  }

  function loadingState(t) { return `<p class="text-muted"><i class="fas fa-spinner fa-spin me-2"></i>${t}</p>`; }
  function errorState(t) { return `<p class="text-danger">${t}</p>`; }
  function updateBadge(section, count) {
    const $b = $(`.profile-nav .nav-item[data-target="${section}"] .badge`);
    if (!$b.length) return;
    if (count > 0) $b.text(count).removeClass("d-none"); else $b.text("0").addClass("d-none");
  }
  function getStatusBadge(status) {
    const s = String(status || "").toLowerCase().replace(/\s+/g, "_");
    if (["pagato", "paid"].includes(s)) return "bg-success";
    return "bg-secondary";
  }

  function sameDate(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function escapeHtml(str) { return String(str ?? "").replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s])); }
  function toastOk(msg) { console.log(msg); }
  function toastErr(msg) { console.error(msg); }
});
