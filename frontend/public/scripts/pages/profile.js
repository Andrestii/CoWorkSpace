// scripts/pages/profile.js
$(document).ready(function () {
  const API = apiConfig.apiUrl;
  const token = localStorage.getItem("authToken");
  if (!token) { window.location.href = "login.html"; return; }

  // ====== Endpoints ======
  const API_USERS = `${API}/users`;
  const API_PREN  = `${API}/prenotazioni`;
  const API_SEDI  = `${API}/sedi`;
  const API_SPAZI = `${API}/spazi`;
  const API_DISP  = `${API}/disponibilita`;

  // ====== Supabase (avatar) ======
  const SUPABASE_URL    = apiConfig.supabaseUrl;
  const SUPABASE_BUCKET = apiConfig.supabaseBucket || "avatars";
  function supaPublicUrl(path) {
    if (!path || !SUPABASE_URL) return null;
    const clean = String(path).replace(new RegExp(`^${SUPABASE_BUCKET}/`), "");
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${clean}`;
  }
  function setImg($img, url, fallback = "https://via.placeholder.com/120?text=Avatar") {
    $img.attr("src", url || fallback)
       .off("error")
       .on("error", function(){ $(this).attr("src", fallback); });
  }

  // ====== NAV switching + niente salto pagina ======
  $(document).on("click", ".profile-nav .nav-item", function (e) {
    e.preventDefault();
    const target = $(this).data("target");
    $(".profile-nav .nav-item").removeClass("active");
    $(this).addClass("active");
    $(".content-section").hide().removeClass("active");
    $("#" + target).show().addClass("active");
    const top = document.querySelector(".profile-container")?.offsetTop || 0;
    window.scrollTo({ top: Math.max(0, top - 10), behavior: "instant" });
  });
  $(document).on("click", "[data-open]", function (e) {
    e.preventDefault();
    const dest = $(this).data("open");
    $(`.profile-nav .nav-item[data-target="${dest}"]`).trigger("click");
  });
  $(document).on("click", 'a[href="#"]', e => e.preventDefault());

  // ====== Bootstrap utente ======
  fetchMe()
    .then(user => {
      if (!user?.id) { window.location.href = "login.html"; return; }
      window.__uid__ = user.id;

      // Header
      $("#user-name").text(user.nome || "Utente");
      $("#user-email").text(user.email || "");
      $("#user-role").text((user.ruolo || "").toUpperCase());

      // Avatar
      const avatar = user.profileImageUrl || (user.profile_image ? supaPublicUrl(user.profile_image) : null);
      setImg($("#profile-image"), avatar);

      // Form info
      $("#nome").val(user.nome || "");
      $("#cognome").val(user.cognome || "");
      $("#email").val(user.email || "");
      $("#telefono").val(user.telefono || "");
      $("#data-nascita").val(user.data_nascita ? String(user.data_nascita).slice(0,10) : "");

      // Nascondi voci non usate (pagamenti/sicurezza)
      $('.profile-nav .nav-item[data-target="pagamenti"]').remove();
      $('.profile-nav .nav-item[data-target="sicurezza"]').remove();
      $("#pagamenti, #sicurezza").remove();

      const ruolo = String(user.ruolo || "").toLowerCase();
      if (ruolo === "gestore") {
        $(".nav-gestore").removeClass("d-none");

        // KPI + ultime (prenotazioni)
        renderKpiSkeleton();
        loadPrenGestore(user.id, { limit: 10, forDashboard: true });
        loadPrenGestore(user.id, { limit: 200, forDashboard: false });

        // Sedi (usa tutte le route sedi)
        ensureSediModal();
        loadMieSedi(user.id);

        // Disponibilità (spazi + slot)
        initDisponibilitaUI();
        loadSpaziGestore(user.id);
      } else {
        $(".nav-gestore").addClass("d-none");
        // Le mie prenotazioni (cliente)
        loadUserBookings();
      }
    })
    .catch(() => window.location.href = "login.html");

  function fetchMe() {
    return $.ajax({
      url: `${API_USERS}/me`,
      type: "GET",
      headers: { Authorization: "Bearer " + token }
    });
  }

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
      $("#data-nascita").val(u.data_nascita ? String(u.data_nascita).slice(0,10) : "");
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

  // ====== Logout ======
  $("#logout-btn").on("click", function () {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });

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
      const dateStr = d ? d.toLocaleString("it-IT", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "-";
      const stato = b.stato || "Sconosciuto";
      const badge = getStatusBadge(stato);
      const tot = (b.totale != null) ? parseFloat(b.totale).toFixed(2) : "0.00";
      const sedeNome = b?.sede?.nome || b?.spazio_nome || "Sede";

      $c.append(`
        <div class="booking-item">
          <div class="booking-header">
            <div class="booking-id">Prenotazione #${String(b.id || "").slice(0,8)}...</div>
            <div class="booking-date">${dateStr}</div>
            <div class="booking-status"><span class="badge ${badge}">${stato}</span></div>
          </div>
          <div class="booking-details">
            <div class="booking-entry">
              <img src="${b?.sede?.immagine || "https://via.placeholder.com/70"}" class="booking-image" alt="sede">
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
  // GESTORE: Le mie SEDI  (usa tutte le route di /sedi)
  // ==========================================================
  function ensureSediModal() {
    // Bottone "Nuova sede" nella sezione
    if (!$(".content-section#mie-sedi .content-header .btn-new-sede").length) {
      $(".content-section#mie-sedi .content-header").append(`
        <button class="btn btn-sm btn-primary ms-2 btn-new-sede">
          <i class="fa-regular fa-plus me-1"></i> Nuova sede
        </button>
      `);
    }
    // Modal Crea/Modifica Sede
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
                  <div class="col-md-6">
                    <label class="form-label">Nome</label>
                    <input type="text" class="form-control" id="sede-nome" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Città</label>
                    <input type="text" class="form-control" id="sede-citta">
                  </div>
                  <div class="col-md-8">
                    <label class="form-label">Indirizzo</label>
                    <input type="text" class="form-control" id="sede-indirizzo">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label d-block">Attiva</label>
                    <input type="checkbox" id="sede-attivo" class="form-check-input">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Descrizione</label>
                    <textarea id="sede-descrizione" class="form-control" rows="3"></textarea>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Immagine (opzionale)</label>
                    <input type="file" id="sede-immagine" class="form-control" accept="image/*">
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Annulla</button>
                <button class="btn btn-primary" type="submit" id="sede-submit">Salva</button>
              </div>
            </form>
          </div>
        </div>
      `);
    }
  }

  // ============================================
// GESTORE: Le mie SEDI (con "Vedi spazi")
// ============================================
function loadMieSedi(userId) {
  const $grid = $("#mie-sedi-grid").empty().append('<div class="text-muted">Caricamento sedi...</div>');
  $.ajax({
    url: `${API_SEDI}/getAllSedi`,
    type: "GET",
    headers: { Authorization: "Bearer " + token },
  })
  .done(sedi => {
    $grid.empty();
    const mie = (sedi || []).filter(s =>
      [s.gestore_id, s.gestoreId, s.owner_id, s.user_id, s.utente_id].some(v => String(v) === String(userId))
    );
    if (!mie.length) {
      updateBadge("mie-sedi", 0);
      $grid.html('<p class="text-muted">Nessuna sede associata al tuo account.</p>');
      return;
    }
    updateBadge("mie-sedi", mie.length);

    mie.forEach(s => {
      const img = s.immagine || "https://via.placeholder.com/400x250?text=Sede";
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
                <button class="btn btn-sm btn-outline-dark btn-vedi-spazi" 
                        data-sede="${sedeId}" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#spazi-sede-${sedeId}" 
                        aria-expanded="false">
                  <i class="fa-regular fa-eye me-1"></i> Vedi spazi
                </button>
              </div>

              <!-- area spazi collapse -->
              <div id="spazi-sede-${sedeId}" class="collapse mt-3">
                <div class="spazi-wrapper border rounded p-2">
                  <div class="text-muted">Carica gli spazi…</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    });
  })
  .fail(() => $grid.html(errorState("Errore nel caricamento delle tue sedi.")));
}

// Cache per spazi caricati per sede
const __SPAZI_SEDE_CACHE__ = {};

// Click su "Vedi spazi" → carica se non in cache, poi mostra
$(document).on("click", ".btn-vedi-spazi", function () {
  const sedeId = $(this).data("sede");
  const $collapse = $(`#spazi-sede-${sedeId}`);
  const $wrap = $collapse.find(".spazi-wrapper");

  // se già caricati, non rifare la chiamata
  if (__SPAZI_SEDE_CACHE__[sedeId]) {
    // niente: la gestione show/hide è gestita da data-bs-toggle="collapse"
    return;
  }

  // al primo click, carico
  $wrap.html('<div class="text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Caricamento spazi…</div>');
  fetchSpaziBySede(sedeId)
    .then(spazi => {
      __SPAZI_SEDE_CACHE__[sedeId] = spazi || [];
      renderSpaziInCard(sedeId, __SPAZI_SEDE_CACHE__[sedeId]);
    })
    .catch(() => {
      $wrap.html('<div class="text-danger">Errore nel caricamento degli spazi.</div>');
    });
});

function fetchSpaziBySede(sedeId) {
  // prova endpoint con filtro ?sede=ID; se fallisce, fallback a tutti + filtro client
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${API_SPAZI}/getSpazi?sede=${encodeURIComponent(sedeId)}`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
    .done(list => {
      // anche se il server filtra, ricontrollo per sicurezza
      resolve((list || []).filter(s => String(s.sede_id || s.id_sede) === String(sedeId)));
    })
    .fail(() => {
      $.ajax({
        url: `${API_SPAZI}/getSpazi`,
        type: "GET",
        headers: { Authorization: "Bearer " + token },
      })
      .done(all => resolve((all || []).filter(s => String(s.sede_id || s.id_sede) === String(sedeId))))
      .fail(reject);
    });
  });
}

function renderSpaziInCard(sedeId, spazi) {
  const $wrap = $(`#spazi-sede-${sedeId} .spazi-wrapper`);
  if (!spazi.length) {
    $wrap.html('<div class="text-muted">Nessuno spazio per questa sede.</div>');
    return;
  }
  const cards = spazi.map(renderSpazioMiniCard).join("");
  $wrap.html(`<div class="row g-2">${cards}</div>`);
}

function renderSpazioMiniCard(sp) {
  const img = sp.immagine || "https://via.placeholder.com/500x300?text=Spazio";
  const attivo = (sp.attivo ?? sp.active) 
    ? '<span class="badge bg-success ms-2">Attivo</span>'
    : '<span class="badge bg-secondary ms-2">Disattivato</span>';
  const cap = Number.isFinite(Number(sp.capienza)) ? `${Number(sp.capienza)} posti` : "—";
  const prezzo = sp.prezzo_orario != null ? `${Number(sp.prezzo_orario).toFixed(2)} € / h` : "—";
  const tipologia = String(sp.tipologia || "").replace(/_/g, " ");
  const linkDisp = `profile.html#disponibilita?spazio=${encodeURIComponent(sp.id)}`;

  return `
    <div class="col-12">
      <div class="card border-0 bg-light">
        <div class="d-flex align-items-stretch gap-2 p-2">
          <img src="${img}" class="rounded" style="width:100px;height:70px;object-fit:cover" alt="${escapeHtml(sp.nome || "Spazio")}">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center">
              <strong>${escapeHtml(sp.nome || "Spazio")}</strong> ${attivo}
            </div>
            <div class="small text-muted">
              ${escapeHtml(tipologia)} • ${escapeHtml(cap)} • ${escapeHtml(prezzo)}
            </div>
          </div>
          <div class="d-flex flex-column gap-1">
            <a href="spazio.html?id=${sp.id}" class="btn btn-sm btn-outline-primary">
              <i class="fa-regular fa-circle-info"></i>
            </a>
            <a href="${linkDisp}" class="btn btn-sm btn-outline-dark" title="Gestisci disponibilità">
              <i class="fa-regular fa-calendar-check"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}


  function renderSedeCard(s) {
    const img = s.immagine || "https://via.placeholder.com/400x250?text=Sede";
    const attiva = s.attivo ?? s.is_active ?? s.active ?? false;
    const badge = attiva ? '<span class="badge bg-success">Attiva</span>' : '<span class="badge bg-secondary">Non attiva</span>';
    return `
      <div class="col-md-6 col-xl-4">
        <div class="card h-100 shadow-sm prodotto-card">
          <img class="card-img-top" src="${img}" alt="${escapeHtml(s.nome || "Sede")}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 class="card-title mb-1">${escapeHtml(s.nome || "Sede")}</h5>
                <p class="card-text text-muted mb-0">${escapeHtml([s.indirizzo, s.citta].filter(Boolean).join(", "))}</p>
              </div>
              ${badge}
            </div>
            <div class="mt-auto d-flex flex-wrap gap-2">
              <a class="btn btn-sm btn-outline-primary" href="sede.html?id=${s.id}">
                <i class="fa-solid fa-circle-info me-1"></i> Dettagli
              </a>
              <button class="btn btn-sm btn-outline-dark btn-edit-sede" data-id="${s.id}">
                <i class="fa-regular fa-pen-to-square me-1"></i> Modifica
              </button>
              <button class="btn btn-sm btn-outline-success btn-attiva-sede" data-id="${s.id}">
                <i class="fa-regular fa-circle-check me-1"></i> Attiva
              </button>
              <button class="btn btn-sm btn-outline-danger btn-del-sede" data-id="${s.id}">
                <i class="fa-regular fa-trash-can me-1"></i> Elimina
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Nuova sede (apri modale)
  $(document).on("click", ".btn-new-sede", function () {
    $("#modalSedeTitle").text("Nuova sede");
    $("#sede-id").val("");
    $("#sede-nome").val("");
    $("#sede-citta").val("");
    $("#sede-indirizzo").val("");
    $("#sede-descrizione").val("");
    $("#sede-attivo").prop("checked", true);
    $("#sede-immagine").val("");
    new bootstrap.Modal(document.getElementById("modalSede")).show();
  });

  // Modifica sede (prefill via GET /sedi/getAllSedi/:id)
  $(document).on("click", ".btn-edit-sede", function () {
    const id = $(this).data("id");
    $.ajax({
      url: `${API_SEDI}/getAllSedi/${id}`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
    .done(s => {
      $("#modalSedeTitle").text("Modifica sede");
      $("#sede-id").val(s.id);
      $("#sede-nome").val(s.nome || "");
      $("#sede-citta").val(s.citta || "");
      $("#sede-indirizzo").val(s.indirizzo || "");
      $("#sede-descrizione").val(s.descrizione || "");
      $("#sede-attivo").prop("checked", !!(s.attivo ?? s.is_active ?? s.active));
      $("#sede-immagine").val(""); // upload opzionale
      new bootstrap.Modal(document.getElementById("modalSede")).show();
    })
    .fail(()=> toastErr("Impossibile leggere la sede"));
  });

  // Salva sede (create/update) — multipart/form-data
  $(document).on("submit", "#form-sede", function (e) {
    e.preventDefault();
    const id = $("#sede-id").val();
    const fd = new FormData();
    fd.append("nome", $("#sede-nome").val().trim());
    fd.append("citta", $("#sede-citta").val().trim());
    fd.append("indirizzo", $("#sede-indirizzo").val().trim());
    fd.append("descrizione", $("#sede-descrizione").val().trim());
    fd.append("attivo", $("#sede-attivo").is(":checked") ? "true" : "false");
    const file = $("#sede-immagine")[0].files?.[0];
    if (file) fd.append("immagine", file);

    const ajaxOpts = {
      type: id ? "PUT" : "POST",
      url: id ? `${API_SEDI}/updateSede/${id}` : `${API_SEDI}/createSede`,
      data: fd, processData: false, contentType: false,
      headers: { Authorization: "Bearer " + token },
    };

    $.ajax(ajaxOpts)
      .done(() => {
        toastOk(id ? "Sede aggiornata" : "Sede creata");
        bootstrap.Modal.getInstance(document.getElementById("modalSede"))?.hide();
        loadMieSedi(window.__uid__);
      })
      .fail(() => toastErr("Errore nel salvataggio della sede"));
  });

  // Attiva sede — PUT /sedi/attivaSede/:id
  $(document).on("click", ".btn-attiva-sede", function () {
    const id = $(this).data("id");
    $.ajax({
      url: `${API_SEDI}/attivaSede/${id}`,
      type: "PUT",
      headers: { Authorization: "Bearer " + token },
    })
    .done(() => { toastOk("Sede attivata"); loadMieSedi(window.__uid__); })
    .fail(() => toastErr("Errore attivazione sede"));
  });

  // Elimina sede — DELETE /sedi/deleteSede/:id
  $(document).on("click", ".btn-del-sede", function () {
    const id = $(this).data("id");
    if (!confirm("Eliminare definitivamente questa sede?")) return;
    $.ajax({
      url: `${API_SEDI}/deleteSede/${id}`,
      type: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
    .done(() => { toastOk("Sede eliminata"); loadMieSedi(window.__uid__); })
    .fail(() => toastErr("Errore eliminazione sede"));
  });

  // ==========================================================
  // GESTORE: Prenotazioni ricevute (per ogni sede del gestore)
  // ==========================================================
  function loadPrenGestore(userId, { limit = 50, forDashboard = false } = {}) {
    const $tbl = $("#tab-pren-gestore tbody");
    if (!forDashboard) $tbl.html(`<tr><td colspan="7" class="text-muted">Caricamento...</td></tr>`);

    // 1) recupera mie sedi
    $.ajax({
      url: `${API_SEDI}/getAllSedi`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
    .done(async (sedi) => {
      const mie = (sedi || []).filter(s =>
        [s.gestore_id, s.gestoreId, s.owner_id, s.user_id, s.utente_id].some(v => String(v) === String(userId))
      );
      if (!mie.length) {
        if (forDashboard) { renderKpiFromBookings([]); renderUltimePren([]); }
        else { $tbl.html(`<tr><td colspan="7" class="text-muted">Nessuna prenotazione trovata.</td></tr>`); updateBadge("prenotazioni-gestore", 0); }
        return;
      }

      // 2) per ogni sede → prenotazioni
      const calls = mie.map(sede =>
        $.ajax({
          url: `${API_PREN}/getPrenotazioniSpazio/${sede.id}`,
          type: "GET",
          headers: { Authorization: "Bearer " + token }
        })
        .then(list => (list || []).map(p => ({ ...p, _sede: sede })))
        .catch(() => [])
      );
      const results = await Promise.all(calls);
      let rows = results.flat();

      // 3) ordina desc e (se dashboard) limita
      rows.sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
      if (forDashboard && limit) rows = rows.slice(0, limit);

      if (forDashboard) { renderKpiFromBookings(rows); renderUltimePren(rows); }
      else { renderPrenGestoreTable(rows); updateBadge("prenotazioni-gestore", rows.length); }
    })
    .fail(() => { if (!forDashboard) $tbl.html(`<tr><td colspan="7" class="text-danger">Errore nel caricamento.</td></tr>`); });
  }

  function renderPrenGestoreTable(rows) {
    const $tbl = $("#tab-pren-gestore tbody").empty();
    if (!rows.length) { $tbl.html(`<tr><td colspan="7" class="text-muted">Nessuna prenotazione trovata.</td></tr>`); return; }
    rows.forEach((r, i) => {
      const d = r.created_at ? new Date(r.created_at) : null;
      const data = d ? d.toLocaleDateString("it-IT") : "-";
      const orario = `${r.ora_inizio || "-"}–${r.ora_fine || "-"}`;
      const stato = r.stato || "—";
      const badge = getStatusBadge(stato);
      const sede = r?.sede?.nome || r.sede_nome || r?._sede?.nome || "—";
      const cliente = r?.utente?.nome || r.cliente_nome || "—";
      const tot = (r.totale != null) ? parseFloat(r.totale).toFixed(2) : "—";
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
  function renderKpiSkeleton() {
    $("#kpi-ogg, #kpi-week, #kpi-month").text("—");
    $("#dash-ultime").html(`<div class="text-muted">Caricamento...</div>`);
  }
  function renderKpiFromBookings(rows) {
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let cToday = 0, cWeek = 0, cMonth = 0;
    (rows || []).forEach(r => {
      const d = r.created_at ? new Date(r.created_at) : (r.data ? new Date(r.data) : null);
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
      const d = r.created_at ? new Date(r.created_at) : null;
      const data = d ? d.toLocaleString("it-IT", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "-";
      const sede = r?.sede?.nome || r.sede_nome || r?._sede?.nome || "—";
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
  // GESTORE: DISPONIBILITÀ (Spazi + CRUD + Attiva/Disattiva data)
  // =================================================
  function initDisponibilitaUI() {
    if (!$("#disp-spazi-list").length) {
      $("#disponibilita .content-body").html(`<div class="row g-3" id="disp-spazi-list"></div>`);
    }
    // Modale create/update slot
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
                <div class="mb-3">
                  <label class="form-label">Data</label>
                  <input type="date" class="form-control" id="disp-data" required>
                </div>
                <div class="row g-2">
                  <div class="col">
                    <label class="form-label">Ora inizio</label>
                    <input type="time" class="form-control" id="disp-ora-inizio" required>
                  </div>
                  <div class="col">
                    <label class="form-label">Ora fine</label>
                    <input type="time" class="form-control" id="disp-ora-fine" required>
                  </div>
                </div>
                <div class="form-check mt-3">
                  <input class="form-check-input" type="checkbox" id="disp-chiuso">
                  <label class="form-check-label" for="disp-chiuso">Giorno chiuso (non prenotabile)</label>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Annulla</button>
                <button class="btn btn-primary" type="submit" id="disp-submit">Salva</button>
              </div>
            </form>
          </div>
        </div>
      `);
    }
    // Modale attiva/disattiva data rapida
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
                <div class="mb-3">
                  <label class="form-label">Seleziona la data</label>
                  <input type="date" class="form-control" id="tg-date" required>
                </div>
                <p class="small text-muted mb-0" id="tg-help"></p>
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Annulla</button>
                <button class="btn btn-primary" type="submit" id="tg-submit">Conferma</button>
              </div>
            </form>
          </div>
        </div>
      `);
    }
  }

  function loadSpaziGestore(userId) {
    const $list = $("#disp-spazi-list").html('<div class="text-muted">Caricamento spazi...</div>');
    $.ajax({
      url: `${API_SPAZI}/getSpazi`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
    .done(spazi => {
      const miei = (spazi || []).filter(s =>
        [s.gestore_id, s.gestoreId, s.owner_id, s.user_id, s.utente_id].some(v => String(v) === String(userId))
      );
      if (!miei.length) {
        $list.html('<div class="col-12 text-muted">Non gestisci ancora nessuno spazio.</div>');
        return;
      }
      $list.empty();
      miei.forEach(sp => {
        const card = $(renderSpazioDispCard(sp));
        $list.append(card);
        loadDisponibilitaSpazio(sp.id);
      });
    })
    .fail(() => $list.html('<div class="col-12 text-danger">Errore nel caricamento degli spazi.</div>'));
  }

  function renderSpazioDispCard(sp) {
    const img = sp.immagine || "https://via.placeholder.com/500x300?text=Spazio";
    return `
      <div class="col-md-6">
        <div class="card h-100 shadow-sm">
          <img src="${img}" class="card-img-top" alt="${escapeHtml(sp.nome || "Spazio")}">
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
                  <thead>
                    <tr>
                      <th>Data</th><th>Inizio</th><th>Fine</th><th>Chiuso</th><th class="text-end">Azioni</th>
                    </tr>
                  </thead>
                  <tbody id="disp-tbody-${sp.id}">
                    <tr><td colspan="5" class="text-muted">Caricamento...</td></tr>
                  </tbody>
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
      url: `${API_DISP}/list`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
    .done(rows => {
      const list = (rows || []).filter(x => String(x.id_spazio || x.spazio_id) === String(spazioId));
      $tb.empty();
      if (!list.length) {
        $tb.html(`<tr><td colspan="5" class="text-muted">Nessuna disponibilità definita.</td></tr>`);
        return;
      }
      list.sort((a,b)=> new Date(a.data) - new Date(b.data));
      list.forEach(d => {
        const closed = d.closed ?? d.chiuso ?? false;
        const id = d.id;
        $tb.append(`
          <tr data-id="${id}">
            <td>${escapeHtml(String(d.data || "").slice(0,10))}</td>
            <td>${escapeHtml(d.ora_inizio || d.start || "-")}</td>
            <td>${escapeHtml(d.ora_fine || d.end || "-")}</td>
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
    .fail(()=> $tb.html(`<tr><td colspan="5" class="text-danger">Errore nel caricamento.</td></tr>`));
  }

  // ====== Nuova disponibilità (apri modale)
  $(document).on("click", ".btn-new-disp", function () {
    const spazioId = $(this).data("spazio");
    $("#modalDispTitle").text("Nuova disponibilità");
    $("#disp-id").val("");
    $("#disp-spazio-id").val(spazioId);
    $("#disp-data").val("");
    $("#disp-ora-inizio").val("");
    $("#disp-ora-fine").val("");
    $("#disp-chiuso").prop("checked", false);
    new bootstrap.Modal(document.getElementById("modalDisp")).show();
  });

  // ====== Modifica disponibilità (apri modale con dati riga)
  $(document).on("click", ".btn-edit-disp", function () {
    const id = $(this).data("id");
    const spazioId = $(this).data("spazio");
    const $tr = $(`#disp-tbody-${spazioId} tr[data-id="${id}"]`);
    const data = $tr.find("td").eq(0).text().trim();
    const inizio = $tr.find("td").eq(1).text().trim();
    const fine = $tr.find("td").eq(2).text().trim();
    const chiuso = $tr.find("td").eq(3).text().includes("Sì");

    $("#modalDispTitle").text("Modifica disponibilità");
    $("#disp-id").val(id);
    $("#disp-spazio-id").val(spazioId);
    $("#disp-data").val(data);
    $("#disp-ora-inizio").val(inizio !== "-" ? inizio : "");
    $("#disp-ora-fine").val(fine !== "-" ? fine : "");
    $("#disp-chiuso").prop("checked", chiuso);
    new bootstrap.Modal(document.getElementById("modalDisp")).show();
  });

  // ====== Salva (create/update) disponibilità
  $(document).on("submit", "#form-disp", function (e) {
    e.preventDefault();
    const id       = $("#disp-id").val();
    const spazioId = $("#disp-spazio-id").val();
    const payload  = {
      id_spazio: Number(spazioId),
      data: $("#disp-data").val(),
      ora_inizio: $("#disp-ora-inizio").val(),
      ora_fine: $("#disp-ora-fine").val(),
      closed: $("#disp-chiuso").is(":checked")
    };
    if (!payload.data) { alert("Seleziona una data"); return; }

    const opts = {
      headers: { Authorization: "Bearer " + token },
      contentType: "application/json",
      data: JSON.stringify(payload)
    };

    if (id) {
      $.ajax({ url: `${API_DISP}/update/${id}`, type: "PUT", ...opts })
        .done(() => {
          toastOk("Disponibilità aggiornata");
          bootstrap.Modal.getInstance(document.getElementById("modalDisp"))?.hide();
          loadDisponibilitaSpazio(spazioId);
        })
        .fail(() => toastErr("Errore nell'aggiornamento"));
    } else {
      $.ajax({ url: `${API_DISP}/create`, type: "POST", ...opts })
        .done(() => {
          toastOk("Disponibilità creata");
          bootstrap.Modal.getInstance(document.getElementById("modalDisp"))?.hide();
          loadDisponibilitaSpazio(spazioId);
        })
        .fail(() => toastErr("Errore nella creazione"));
    }
  });

  // ====== Elimina disponibilità
  $(document).on("click", ".btn-del-disp", function () {
    const id = $(this).data("id");
    const spazioId = $(this).data("spazio");
    if (!confirm("Eliminare questa disponibilità?")) return;
    $.ajax({
      url: `${API_DISP}/delete/${id}`,
      type: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
    .done(() => { toastOk("Disponibilità eliminata"); loadDisponibilitaSpazio(spazioId); })
    .fail(() => toastErr("Errore nell'eliminazione"));
  });

  // ====== Attiva/Disattiva data (calendarino)
  $(document).on("click", ".btn-close-date, .btn-open-date", function () {
    const spazioId = $(this).data("spazio");
    const action = $(this).hasClass("btn-close-date") ? "close" : "open";
    $("#tg-spazio-id").val(spazioId);
    $("#tg-action").val(action);
    $("#tg-date").val("");
    $("#toggleDateTitle").text(action === "close" ? "Disattiva data" : "Attiva data");
    $("#tg-help").text(
      action === "close"
        ? "La data selezionata sarà resa non prenotabile per questo spazio."
        : "La data selezionata sarà resa prenotabile (se esiste uno slot chiuso verrà riaperto)."
    );
    new bootstrap.Modal(document.getElementById("modalToggleDate")).show();
  });

  $(document).on("submit", "#form-toggle-date", async function (e) {
    e.preventDefault();
    const spazioId = $("#tg-spazio-id").val();
    const action   = $("#tg-action").val();   // "close" | "open"
    const date     = $("#tg-date").val();     // YYYY-MM-DD
    if (!date) { alert("Seleziona una data"); return; }

    try {
      await upsertToggleDate(spazioId, date, action === "close");
      toastOk(action === "close" ? "Data disattivata" : "Data attivata");
      bootstrap.Modal.getInstance(document.getElementById("modalToggleDate"))?.hide();
      loadDisponibilitaSpazio(spazioId);
    } catch (err) {
      toastErr("Operazione non riuscita");
    }
  });

  async function upsertToggleDate(spazioId, date, closed) {
    const list = await $.ajax({
      url: `${API_DISP}/list`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    });
    const sameDay = (d1, d2) => String(d1).slice(0,10) === String(d2).slice(0,10);
    const existing = (list || []).find(x =>
      String(x.id_spazio || x.spazio_id) === String(spazioId) && sameDay(x.data, date)
    );

    const payload = {
      id_spazio: Number(spazioId),
      data: date,
      ora_inizio: "00:00",
      ora_fine: "23:59",
      closed: !!closed
    };
    const opts = {
      headers: { Authorization: "Bearer " + token },
      contentType: "application/json",
      data: JSON.stringify(payload)
    };

    if (existing?.id) {
      return $.ajax({ url: `${API_DISP}/update/${existing.id}`, type: "PUT", ...opts });
    } else {
      return $.ajax({ url: `${API_DISP}/create`, type: "POST", ...opts });
    }
  }

  // ====== Helpers ======
  function loadingState(t) { return `<p class="text-muted"><i class="fas fa-spinner fa-spin me-2"></i>${t}</p>`; }
  function errorState(t)   { return `<p class="text-danger">${t}</p>`; }
  function updateBadge(section, count) {
    const $b = $(`.profile-nav .nav-item[data-target="${section}"] .badge`);
    if (!$b.length) return;
    if (count > 0) $b.text(count).removeClass("d-none"); else $b.text("0").addClass("d-none");
  }
  function getStatusBadge(status) {
    const s = String(status || "").toLowerCase();
    if (["pending","nuovo"].includes(s)) return "bg-warning text-dark";
    if (["processing","in lavorazione"].includes(s)) return "bg-info text-dark";
    if (["confirmed","confermato"].includes(s)) return "bg-primary";
    if (["completed","completato"].includes(s)) return "bg-success";
    if (["cancelled","annullato"].includes(s)) return "bg-danger";
    return "bg-secondary";
  }
  function sameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function toastOk(msg){ console.log(msg); }
  function toastErr(msg){ console.error(msg); }
});
