// scripts/pages/creaSedi.js
$(async function () {
  const token = localStorage.getItem("authToken");
  if (!token) { window.location.href = "login.html"; return; }

  const API_ROOT = apiConfig.apiUrl;
  const API_USERS = `${API_ROOT}/users`;
  const API_SEDI  = `${API_ROOT}/sedi`;

  // role guard
  try {
    const me = await $.ajax({ url: `${API_USERS}/me`, headers: { Authorization: "Bearer " + token }});
    if ((me?.ruolo || "").toLowerCase() !== "gestore") {
      window.location.href = "profilo.html";
      return;
    }
  } catch {
    window.location.href = "login.html";
    return;
  }

  // preview
  $("#sede-immagine").on("change", function () {
    const f = this.files?.[0];
    if (!f) return $("#sede-preview").addClass("d-none");
    const url = URL.createObjectURL(f);
    $("#sede-preview").attr("src", url).removeClass("d-none");
  });

  // toast helper
  function toast(msg, ok = true) {
    const $t = $("#crea-sede-toast");
    $t.removeClass("bg-success bg-danger").addClass(ok ? "bg-success" : "bg-danger");
    $t.find(".toast-body").text(msg);
    bootstrap.Toast.getOrCreateInstance($t[0], { delay: 2000 }).show();
  }

  $("#form-sede").on("submit", async function (e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("nome", $("#sede-nome").val().trim());
    fd.append("citta", $("#sede-citta").val().trim());
    fd.append("indirizzo", $("#sede-indirizzo").val().trim());
    fd.append("descrizione", $("#sede-descrizione").val().trim());
    fd.append("attiva", $("#sede-attivo").is(":checked") ? 1 : 0);
    const img = $("#sede-immagine")[0]?.files?.[0];
    if (img) fd.append("immagine", img);

    try {
      await $.ajax({
        url: `${API_SEDI}/create`,
        type: "POST",
        data: fd, processData: false, contentType: false,
        headers: { Authorization: "Bearer " + token }
      });
      toast("Sede creata con successo");
      setTimeout(() => window.location.href = "profilo.html", 700);
    } catch (xhr) {
      toast(xhr?.responseJSON?.message || "Errore nella creazione della sede", false);
    }
  });
});
