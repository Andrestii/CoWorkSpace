// scripts/pages/creaSpazi.js
$(async function () {
  const token = localStorage.getItem("authToken");
  if (!token) { window.location.href = "login.html"; return; }

  const API_ROOT = apiConfig.apiUrl;
  const API_USERS = `${API_ROOT}/users`;
  const API_SEDI  = `${API_ROOT}/sedi`;
  const API_SPAZI = `${API_ROOT}/spazi`;

  // role guard
  let mieSedi = [];
  try {
    const me = await $.ajax({ url: `${API_USERS}/me`, headers: { Authorization: "Bearer " + token }});
    if ((me?.ruolo || "").toLowerCase() !== "gestore") {
      window.location.href = "profilo.html";
      return;
    }
    mieSedi = await $.ajax({ url: `${API_SEDI}/mie`, headers: { Authorization: "Bearer " + token }});
  } catch {
    window.location.href = "login.html";
    return;
  }

  // popola select sedi
  const $combo = $("#spazio-sede");
  if (!mieSedi?.length) {
    $("#no-sedi-alert").removeClass("d-none");
    $combo.html('<option value="">—</option>').prop("disabled", true);
  } else {
    const opts = mieSedi.map(s => `<option value="${s.id}">${escapeHtml(s.nome || ('Sede #' + s.id))}</option>`).join("");
    $combo.html(opts).prop("disabled", false);
  }

  // img preview
  $("#spazio-immagine").on("change", function () {
    const f = this.files?.[0];
    if (!f) return $("#spazio-preview").addClass("d-none");
    const url = URL.createObjectURL(f);
    $("#spazio-preview").attr("src", url).removeClass("d-none");
  });

  // toast helper
  function toast(msg, ok = true) {
    const $t = $("#crea-spazio-toast");
    $t.removeClass("bg-success bg-danger").addClass(ok ? "bg-success" : "bg-danger");
    $t.find(".toast-body").text(msg);
    bootstrap.Toast.getOrCreateInstance($t[0], { delay: 2000 }).show();
  }
  function escapeHtml(str) { return String(str ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }

  $("#form-spazio").on("submit", async function (e) {
    e.preventDefault();
    const sedeId = $("#spazio-sede").val();
    if (!sedeId) { toast("Seleziona una sede", false); return; }

    const fd = new FormData();
    fd.append("nome", $("#spazio-nome").val().trim());
    fd.append("id_sede", sedeId);
    fd.append("tipologia", $("#spazio-tipologia").val());
    if ($("#spazio-capienza").val())  fd.append("capienza", $("#spazio-capienza").val());
    if ($("#spazio-prezzo").val())    fd.append("prezzo_orario", $("#spazio-prezzo").val());
    fd.append("descrizione", $("#spazio-descrizione").val().trim());
    if ($("#spazio-indirizzo").val()) fd.append("indirizzo", $("#spazio-indirizzo").val().trim());
    fd.append("attivo", $("#spazio-attivo").is(":checked") ? 1 : 0);
    const img = $("#spazio-immagine")[0]?.files?.[0];
    if (img) fd.append("immagine", img);

    try {
      await $.ajax({
        url: `${API_SPAZI}/create`,
        type: "POST",
        data: fd, processData: false, contentType: false,
        headers: { Authorization: "Bearer " + token }
      });
      toast("Spazio creato con successo");
      setTimeout(() => window.location.href = "profilo.html", 700);
    } catch (xhr) {
      toast(xhr?.responseJSON?.message || "Errore nella creazione dello spazio", false);
    }
  });
});
