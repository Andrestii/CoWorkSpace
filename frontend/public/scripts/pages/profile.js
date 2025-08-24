// scripts/pages/profile.js
$(document).ready(function () {
  const API_USERS = `${apiConfig.apiUrl}/users`;
  const token = localStorage.getItem('authToken');
  if (!token) { window.location.href = "login.html"; return; }

  // === Supabase config (adatta se necessario) ===
  const SUPABASE_URL = apiConfig.supabaseUrl;            // es: 'https://xxxx.supabase.co'
  const SUPABASE_BUCKET = apiConfig.supabaseBucket || 'avatars'; // nome bucket Storage

  // === Helpers immagini (Supabase + fallback) ===
  function supaPublicUrl(path) {
    if (!path) return null;
    // Rimuovo eventuale prefisso 'avatars/' doppio
    const clean = String(path).replace(new RegExp(`^${SUPABASE_BUCKET}/`), '');
    // URL pubblica solo se il bucket è pubblico
    if (!SUPABASE_URL) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${clean}`;
  }
  function setImg($img, url, fallback = "https://via.placeholder.com/120?text=Avatar") {
    const finalUrl = url || fallback;
    $img.attr("src", finalUrl)
      .off("error")
      .on("error", function () { $(this).attr("src", fallback); });
  }

  // --- NAV switching ---
  $(document).on("click", ".profile-nav .nav-item", function () {
    const target = $(this).data("target");
    $(".profile-nav .nav-item").removeClass("active");
    $(this).addClass("active");
    $(".content-section").hide().removeClass("active");
    $("#" + target).show().addClass("active");
  });
  $(document).on("click", "[data-open]", function (e) {
    e.preventDefault();
    const dest = $(this).data("open");
    $(`.profile-nav .nav-item[data-target="${dest}"]`).trigger("click");
  });

  // --- Bootstrap dati utente ---
  fetchCurrentUser().then(user => {
    if (!user || !user.id) { window.location.href = "login.html"; return; }

    // Header UI
    $("#user-name").text(user.nome || "Utente");
    $("#user-email").text(user.email || "");
    $("#user-role").text((user.ruolo || "").toUpperCase());

    // Immagine profilo da Supabase:
    // 1) preferisci signed URL dal backend (profileImageUrl)
    // 2) altrimenti costruisci public URL dal path (profile_image)
    const profileUrl =
      user.profileImageUrl || user.profile_image || null;


    setImg($("#profile-image"), profileUrl, "https://via.placeholder.com/120?text=Avatar");

    // Compila form Info
    $("#nome").val(user.nome || "");
    $("#cognome").val(user.cognome || "");
    $("#email").val(user.email || "");
    $("#telefono").val(user.telefono || "");
    $("#data-nascita").val(user.data_nascita ? String(user.data_nascita).substring(0,10) : "");

    // Ruolo
    const ruolo = (user.ruolo || "").toLowerCase();
    if (ruolo === "gestore") {
      $(".nav-gestore").removeClass("d-none");
      renderKpiSkeleton();
      loadMieSedi(user.id);
      loadPrenGestore(user.id, { limit: 10, forDashboard: true });
    } else {
      $(".nav-gestore").addClass("d-none");
    }

    // Sezioni cliente
    loadUserBookings(user.id);
    loadPaymentMethods(user.id);
  }).catch(() => window.location.href = "login.html");

  function fetchCurrentUser() {
    return $.ajax({ url: `${API_USERS}/me`, type: "GET", headers: { Authorization: "Bearer " + token } });
  }

  // --- Edit info personali ---
  $("#edit-info-btn").on("click", function () {
    $("#info-personali input").prop("readonly", false);
    $("#cancel-edit, #save-profile").removeClass("d-none");
    $(this).prop("disabled", true);
  });

  $("#cancel-edit").on("click", function () {
    fetchCurrentUser().then(u => {
      $("#nome").val(u.nome || "");
      $("#cognome").val(u.cognome || "");
      $("#email").val(u.email || "");
      $("#telefono").val(u.telefono || "");
      $("#data-nascita").val(u.data_nascita ? String(u.data_nascita).substring(0,10) : "");

      const url = u.profileImageUrl || (u.profile_image ? supaPublicUrl(u.profile_image) : null);
      setImg($("#profile-image"), url, "https://via.placeholder.com/120?text=Avatar");
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

        // aggiorna anche l'immagine se il backend restituisce i nuovi campi
        const url = u.profileImageUrl || (u.profile_image ? supaPublicUrl(u.profile_image) : null);
        if (url) setImg($("#profile-image"), url, "https://via.placeholder.com/120?text=Avatar");
      })
      .fail(xhr => alert(xhr?.responseJSON?.error || "Errore durante l'aggiornamento del profilo"));
  });

  // --- Upload avatar (verso /users/profile-image) ---
  $("#avatar-edit-btn").on("click", function () { $("#avatar-upload").trigger("click"); });
  $("#avatar-upload").on("change", function () {
    const file = this.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("profileImage", file);

    $.ajax({
      url: `${API_USERS}/profile-image`,
      type: "POST",
      data: fd, processData: false, contentType: false,
      headers: { Authorization: "Bearer " + token }
    })
      .done(u => {
        // Preferisci signed URL; se non c'è, costruisci public URL dal path
        const url = u.profileImageUrl || (u.profile_image ? supaPublicUrl(u.profile_image) : null);
        setImg($("#profile-image"), url, "https://via.placeholder.com/120?text=Avatar");
      })
      .fail(xhr => alert(xhr?.responseJSON?.error || "Errore nel caricamento dell'immagine"));
  });

  // --- Logout ---
  $("#logout-btn").on("click", function () {
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });

  // ======== Cliente: PRENOTAZIONI ========
  function loadUserBookings(userId) {
    const container = $("#prenotazioni");
    container.html(loadingState("Caricamento prenotazioni..."));
    $.ajax({
      url: `${apiConfig.apiUrl}/bookings/user/${userId}`, // adatta al tuo backend
      type: "GET", headers: { Authorization: "Bearer " + token },
    })
      .done((bookings) => renderBookingsOverview(bookings, container))
      .fail(() => container.html(errorState("Errore nel caricamento delle prenotazioni.")));
  }

  function renderBookingsOverview(bookings, container) {
    container.empty();
    if (!bookings || bookings.length === 0) {
      container.html('<p class="text-muted text-center">Non hai ancora effettuato prenotazioni.</p>');
      updateBadge("prenotazioni", 0); return;
    }
    updateBadge("prenotazioni", bookings.length);

    bookings.forEach((b) => {
      const date = b.created_at ? new Date(b.created_at) : null;
      const dateStr = date ? date.toLocaleString("it-IT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
      const status = (b.stato || "Sconosciuto");
      const badge = getStatusBadge(status);
      const total = (b.totale != null) ? parseFloat(b.totale).toFixed(2) : "0.00";

      const html = `
        <div class="booking-item">
          <div class="booking-header">
            <div class="booking-id">Prenotazione #${String(b.id || "").substring(0, 8)}...</div>
            <div class="booking-date">${dateStr}</div>
            <div class="booking-status"><span class="badge ${badge}">${status}</span></div>
          </div>
          <div class="booking-details">
            <div class="booking-entry">
              <img src="${b?.sede?.immagine || "https://via.placeholder.com/70"}" class="booking-image" alt="sede">
              <div class="booking-info">
                <h6>${b?.sede?.nome || "Sede"} - ${b?.tipo || "Postazione"}</h6>
                <p class="text-muted mb-0">Durata: ${b?.durata || "N/D"} ore</p>
              </div>
            </div>
          </div>
          <div class="booking-footer">
            <div class="booking-total">Totale:
              <span class="fw-bold text-primary">€${total}</span>
            </div>
            <div class="booking-actions">
              <a href="booking-details.html?id=${b.id}" class="btn btn-sm btn-outline-primary">Dettagli</a>
            </div>
          </div>
        </div>`;
      container.append(html);
    });
  }

  // ======== Cliente: METODI DI PAGAMENTO ========
  function loadPaymentMethods(userId) {
    const container = $("#pagamenti");
    container.html(loadingState("Caricamento metodi di pagamento..."));
    $.ajax({
      url: `${apiConfig.apiUrl}/metodiPagamento/utente/${userId}`, // adatta al tuo backend
      type: "GET", headers: { Authorization: "Bearer " + token },
    })
      .done((methods) => renderPaymentMethods(methods))
      .fail(() => container.html(errorState("Errore nel caricamento dei metodi di pagamento.")));
  }

  function renderPaymentMethods(methods) {
    const container = $("#pagamenti");
    container.empty();
    if (!methods || methods.length === 0) {
      container.html(`
        <p class="text-muted text-center">Nessun metodo di pagamento salvato.</p>
        <div class="text-center mt-3">
          <button class="btn btn-primary" id="add-payment-method">
            <i class="fas fa-plus me-2"></i>Aggiungi Metodo
          </button>
        </div>`);
      updateBadge("pagamenti", 0); return;
    }
    updateBadge("pagamenti", methods.length);

    methods.forEach((m) => {
      const cardType = m.tipo_carta || "Carta";
      const icon = getCardIcon(cardType);
      const last4 = m.numero_carta ? String(m.numero_carta).slice(-4) : "XXXX";
      const scad = m.data_scadenza || "N/D";
      const isDefault = !!m.is_default;

      const html = `
        <div class="payment-method-item" data-method-id="${m.id}">
          <div class="payment-icon"><i class="fab ${icon}"></i></div>
          <div class="payment-info">
            <h6>${cardType} •••• ${last4}</h6>
            <p class="text-muted mb-0">Scadenza: ${scad}</p>
          </div>
          ${isDefault ? '<div class="payment-default-badge">Predefinita</div>' : ""}
          <div class="payment-actions">
            ${!isDefault ? `<button class="btn btn-sm btn-outline-primary me-2">Imposta</button>` : ""}
            <button class="btn btn-sm btn-outline-dark me-2">Modifica</button>
            <button class="btn btn-sm btn-outline-danger">Rimuovi</button>
          </div>
        </div>`;
      container.append(html);
    });
  }

  // ======== Gestore: LE MIE SEDI ========
  function loadMieSedi(userId) {
    const grid = $("#mie-sedi-grid").empty().append('<div class="text-muted">Caricamento sedi...</div>');
    $.ajax({
      url: `${apiConfig.apiUrl}/sedes/byUser/${userId}`, // adatta al tuo backend
      type: "GET", headers: { Authorization: "Bearer " + token },
    })
      .done((sedi) => {
        grid.empty();
        if (!sedi || !sedi.length) { grid.html('<p class="text-muted">Nessuna sede associata al tuo account.</p>'); updateBadge("mie-sedi", 0); return; }
        updateBadge("mie-sedi", sedi.length);
        sedi.forEach((s) => {
          const img = s.immagine || "https://via.placeholder.com/400x250?text=Sede";
          grid.append(`
            <div class="col-md-6 col-xl-4">
              <div class="card h-100 shadow-sm prodotto-card">
                <img class="card-img-top" src="${img}" alt="${escapeHtml(s.nome)}">
                <div class="card-body">
                  <h5 class="card-title">${escapeHtml(s.nome)}</h5>
                  <p class="card-text text-muted">${escapeHtml([s.indirizzo, s.citta].filter(Boolean).join(", "))}</p>
                  <a class="btn btn-sm btn-outline-primary" href="sede.html?id=${s.id}">
                    <i class="fa-solid fa-circle-info me-1"></i> Dettagli
                  </a>
                </div>
              </div>
            </div>`);
        });
      })
      .fail(() => grid.html(errorState("Errore nel caricamento delle tue sedi.")));
  }

  // ======== Gestore: PRENOTAZIONI RICEVUTE + KPI ========
  function loadPrenGestore(userId, { limit = 50, forDashboard = false } = {}) {
    const $tbl = $("#tab-pren-gestore tbody");
    if (!forDashboard) { $tbl.html(`<tr><td colspan="7" class="text-muted">Caricamento...</td></tr>`); }

    $.ajax({
      url: `${apiConfig.apiUrl}/bookings/gestore/${userId}?limit=${limit}`, // adatta al tuo backend
      type: "GET", headers: { Authorization: "Bearer " + token },
    })
      .done((rows) => {
        if (forDashboard) { renderKpiFromBookings(rows || []); renderUltimePren(rows || []); }
        else { renderPrenGestoreTable(rows || []); updateBadge("prenotazioni-gestore", (rows || []).length); }
      })
      .fail(() => { if (!forDashboard) $tbl.html(`<tr><td colspan="7" class="text-danger">Errore nel caricamento.</td></tr>`); });
  }

  function renderPrenGestoreTable(rows) {
    const $tbl = $("#tab-pren-gestore tbody");
    $tbl.empty();
    if (!rows.length) { $tbl.html(`<tr><td colspan="7" class="text-muted">Nessuna prenotazione trovata.</td></tr>`); return; }
    rows.forEach((r, i) => {
      const d = r.created_at ? new Date(r.created_at) : null;
      const data = d ? d.toLocaleDateString("it-IT") : "-";
      const orario = `${r.ora_inizio || "-"}–${r.ora_fine || "-"}`;
      const stato = r.stato || "—";
      const badge = getStatusBadge(stato);
      const sede = r?.sede?.nome || r.sede_nome || "—";
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
        </tr>`);
    });
  }

  // KPI & Dashboard
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
      const d = new Date(r.created_at || r.data);
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
      const data = d ? d.toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";
      const sede = r?.sede?.nome || r.sede_nome || "—";
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

  // --- Helpers ---
  function loadingState(text) { return `<p class="text-muted"><i class="fas fa-spinner fa-spin me-2"></i>${text}</p>`; }
  function errorState(text) { return `<p class="text-danger">${text}</p>`; }
  function updateBadge(section, count) {
    const badge = $(`.profile-nav .nav-item[data-target="${section}"] .badge`);
    if (!badge.length) return;
    if (count > 0) badge.text(count).removeClass("d-none"); else badge.text("0").addClass("d-none");
  }
  function getCardIcon(type) {
    type = String(type || "").toLowerCase();
    if (type.includes("visa")) return "fa-cc-visa";
    if (type.includes("mastercard")) return "fa-cc-mastercard";
    if (type.includes("amex")) return "fa-cc-amex";
    return "fa-credit-card";
  }
  function getStatusBadge(status) {
    const s = String(status || "").toLowerCase();
    if (["pending", "nuovo"].includes(s)) return "bg-warning text-dark";
    if (["processing", "in lavorazione"].includes(s)) return "bg-info text-dark";
    if (["confirmed", "confermato"].includes(s)) return "bg-primary";
    if (["completed", "completato"].includes(s)) return "bg-success";
    if (["cancelled", "annullato"].includes(s)) return "bg-danger";
    return "bg-secondary";
  }
  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
  }
});
