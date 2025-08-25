// scripts/pages/creaSedi.js
$(async function () {
  const token = localStorage.getItem("authToken");
  if (!token) { window.location.href = "login.html"; return; }

  const API_ROOT = apiConfig.apiUrl;
  const API_USERS = `${API_ROOT}/users`;
  const API_SEDI  = `${API_ROOT}/sedi`;

  // Solo gestore o admin
  try {
    const me = await $.ajax({ url: `${API_USERS}/me`, headers: { Authorization: "Bearer " + token } });
    const ruolo = String(me?.ruolo || "").toLowerCase();
    if (!["gestore","admin"].includes(ruolo)) {
      window.location.href = "profilo.html"; return;
    }
  } catch {
    window.location.href = "login.html"; return;
  }

  // Helpers toast
  function toastOk(msg) {
    $("#global-toast").removeClass("text-bg-danger").addClass("text-bg-success");
    $("#global-toast-body").text(msg || "Operazione completata");
    bootstrap.Toast.getOrCreateInstance(document.getElementById("global-toast"), { delay: 2000 }).show();
  }
  function toastErr(msg) {
    $("#global-toast").removeClass("text-bg-success").addClass("text-bg-danger");
    $("#global-toast-body").text(msg || "Errore");
    bootstrap.Toast.getOrCreateInstance(document.getElementById("global-toast"), { delay: 3000 }).show();
  }

  // Normalizza sigla provincia
  $("#provincia").on("input", function () {
    this.value = this.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0,2);
  });

  // Validazioni base CAP e numeri
  $("#cap").on("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0,5);
  });

  // Submit
  $("#form-crea-sede").on("submit", async function (e) {
    e.preventDefault();

    // HTML5 validation
    if (!this.checkValidity()) {
      e.stopPropagation();
      $(this).addClass("was-validated");
      return;
    }

    const fd = new FormData();
    fd.append("nome",        $("#nome").val().trim());
    fd.append("descrizione", $("#descrizione").val().trim());
    fd.append("indirizzo",   $("#indirizzo").val().trim());
    fd.append("citta",       $("#citta").val().trim());
    fd.append("provincia",   $("#provincia").val().trim());
    fd.append("cap",         $("#cap").val().trim());
    fd.append("regione",     $("#regione").val().trim());

    // opzionali numerici
    const lat = $("#latitudine").val();
    const lon = $("#longitudine").val();
    if (lat) fd.append("latitudine", lat);
    if (lon) fd.append("longitudine", lon);

    // immagine opzionale
    const img = $("#immagine")[0]?.files?.[0];
    if (img) fd.append("immagine", img);

    // flag attivo
    fd.append("attiva", $("#attiva").is(":checked") ? 1 : 0);

    try {
      await $.ajax({
        url: `${API_SEDI}/create`,
        type: "POST",
        data: fd,
        processData: false,
        contentType: false,
        headers: { Authorization: "Bearer " + token }
      });

      toastOk("Sede creata con successo");
      // Torna alla lista delle mie sedi
      setTimeout(() => window.location.href = "profilo.html#mie-sedi", 600);
    } catch (xhr) {
      const msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || "Errore durante la creazione della sede";
      toastErr(msg);
    }
  });
});
