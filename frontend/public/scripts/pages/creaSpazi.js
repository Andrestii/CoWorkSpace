// scripts/pages/creaSpazi.js
$(async function () {
  const token = localStorage.getItem("authToken");
  if (!token) { window.location.href = "login.html"; return; }

  const API_ROOT = apiConfig.apiUrl;
  const API_USERS = `${API_ROOT}/users`;
  const API_SEDI = `${API_ROOT}/sedi`;
  const API_SPAZI = `${API_ROOT}/spazi`;

  // ===== Helpers =====
  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, s => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[s]));
  }
  function toast(msg, ok = true, delay = 2200) {
    const $t = $("#crea-spazio-toast");
    $t.removeClass("bg-success bg-danger").addClass(ok ? "bg-success" : "bg-danger");
    $t.find(".toast-body").text(msg);
    bootstrap.Toast.getOrCreateInstance($t[0], { delay }).show();
  }
  const authHdr = { Authorization: "Bearer " + token };

  // ===== Guard ruolo + carico sedi utente =====
  let mieSedi = [];
  try {
    const me = await $.ajax({ url: `${API_USERS}/me`, headers: authHdr });
    if ((me?.ruolo || "").toLowerCase() !== "gestore") {
      window.location.href = "profilo.html";
      return;
    }
    mieSedi = await $.ajax({ url: `${API_SEDI}/mie`, headers: authHdr });
  } catch (err) {
    console.error("Errore caricamento profilo/sedi:", err);
    window.location.href = "login.html";
    return;
  }

  // ===== Popolo select sedi =====
  const $combo = $("#spazio-sede");
  if (!mieSedi?.length) {
    $("#no-sedi-alert").removeClass("d-none");
    $combo.html('<option value="">—</option>').prop("disabled", true);
  } else {
    const opts = mieSedi.map(s => `<option value="${s.id}">${escapeHtml(s.nome || ('Sede #' + s.id))}</option>`).join("");
    $combo.html(opts).prop("disabled", false);
  }

  // ===== Anteprima immagine =====
  let previewURL = null;
  $("#spazio-immagine").on("change", function () {
    const f = this.files?.[0];
    const $img = $("#spazio-preview");
    if (!f) {
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = null;
      return $img.addClass("d-none");
    }
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(f);
    $img.attr("src", previewURL).removeClass("d-none");
  });

  // ===== Submit =====
  $("#form-spazio").on("submit", async function (e) {
    e.preventDefault();

    // Validazioni minime lato client
    const sedeId = $("#spazio-sede").val();
    const nome = $("#spazio-nome").val().trim();
    const tipologia = $("#spazio-tipologia").val();
    const prezzo = $("#spazio-prezzo").val();

    if (!sedeId) { toast("Seleziona una sede", false); return; }
    if (!nome) { toast("Inserisci il nome dello spazio", false); return; }
    if (!tipologia) { toast("Seleziona la tipologia", false); return; }
    if (prezzo === "" || isNaN(Number(prezzo))) {
      toast("Inserisci un prezzo orario valido", false); return;
    }

    // Normalizzo i dati
    const capienza = $("#spazio-capienza").val();
    const descr = $("#spazio-descrizione").val().trim();
    const attivo = $("#spazio-attivo").is(":checked") ? 1 : 0;
    const img = $("#spazio-immagine")[0]?.files?.[0];

    const fd = new FormData();
    fd.append("id_sede", String(sedeId));
    fd.append("nome", nome);
    fd.append("tipologia", String(tipologia));                  // 'postazione' | 'ufficio' | 'sala_riunioni'
    fd.append("prezzo_orario", Number(prezzo).toFixed(2));
    if (capienza) fd.append("capienza", Number(capienza));
    if (descr) fd.append("descrizione", descr);
    fd.append("attivo", attivo);
    if (img) fd.append("immagine", img);

    // Disabilito bottone durante il submit
    const $btn = $(this).find('button[type="submit"]');
    const old = $btn.html();
    $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm me-2"></span>Salvataggio…');

    try {
      await $.ajax({
        url: `${API_SPAZI}/createSpazio`,
        type: "POST",
        data: fd,
        processData: false,
        contentType: false,
        headers: authHdr
      });

      toast("Spazio creato con successo");
      setTimeout(() => window.location.href = "profilo.html", 800);
    } catch (xhr) {
      const msg = xhr?.responseJSON?.error || xhr?.responseJSON?.message || "Errore nella creazione dello spazio";
      console.error("Create spazio failed:", xhr);
      toast(msg, false, 3200);
      $btn.prop("disabled", false).html(old);
    }
  });
});
