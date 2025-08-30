$(document).ready(function () {
  const API_SPAZI = `${apiConfig.apiUrl}/spazi`;
  const API_SEDI = `${apiConfig.apiUrl}/sedi`;
  const API_SERVIZI = `${apiConfig.apiUrl}/servizi`;
  const token = localStorage.getItem("authToken");

  const params = new URLSearchParams(window.location.search);
  const spazioId = Number(params.get("id"));

  if (!spazioId) {
    $("#loading").hide();
    $("#errore").removeClass("d-none").text("ID spazio mancante.");
    return;
  }

  // Helpers stile identico
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }
  function capTipologia(t) {
    if (!t) return "";
    return String(t).replace(/_/g, " ")
      .split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  // Carico lista spazi
  $.ajax({
    url: `${API_SPAZI}/getSpazi`,
    type: "GET",
    headers: { Authorization: "Bearer " + token },
  })
    .done(function (spazi) {
      const spazio = (Array.isArray(spazi) ? spazi : []).find(s => Number(s.id) === spazioId);
      if (!spazio) {
        $("#loading").hide();
        $("#errore").removeClass("d-none").text("Spazio non trovato.");
        return;
      }

      // Aggiorna hero
      $("#spazioNome").text(spazio.nome || "Spazio");

      if (spazio.id_sede) {
        $.ajax({
          url: `${API_SEDI}/getAllSedi/${spazio.id_sede}`,
          type: "GET",
          headers: { Authorization: "Bearer " + token },
        })
          .done((sede) => renderDettaglio(spazio, sede || null))
          .fail(() => renderDettaglio(spazio, null));
      } else {
        renderDettaglio(spazio, null);
      }
    })
    .fail(function (xhr) {
      $("#loading").hide();
      let msg = "Errore nel caricamento dei dati.";
      if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
        msg = xhr.responseJSON.error || xhr.responseJSON.message;
      }
      $("#errore").removeClass("d-none").text(msg);
    });

  function renderDettaglio(spazio, sede) {
    $("#loading").hide();

    const imgSrc = spazio.immagine || "https://via.placeholder.com/1200x600?text=Spazio";
    const tip = capTipologia(spazio.tipologia);
    const cap = Number.isFinite(spazio.capienza) ? `${spazio.capienza} posti` : "-";
    const prezzo = (spazio.prezzo_orario != null) ? `${Number(spazio.prezzo_orario).toFixed(2)} € / h` : "-";

    // Riga sede 
    const sedeRiga = sede ? `
    <li>
      <i class="fa-solid fa-building me-2"></i>
      <a href="sede.html?id=${sede.id}">${escapeHtml(sede.nome || "Sede")}</a>
    </li>
    <li>
      <i class="fa-solid fa-location-dot me-2"></i>
      ${escapeHtml(sede.indirizzo || "")}${sede.citta ? ", " + escapeHtml(sede.citta) : ""}
    </li>
  ` : "";

    // Riga tipologia
    const tipologiaRiga = tip ? `
    <li>
      <strong>Tipologia:</strong> ${tip}
    </li>` : "";

    const html = `
    <div class="row g-4">
      <div class="col-lg-6">
        <img src="${imgSrc}" class="img-fluid rounded shadow-sm" alt="${escapeHtml(spazio.nome || "Spazio")}">
      </div>
      <div class="col-lg-6">
        <h2>${escapeHtml(spazio.nome || "Spazio")}</h2>
        <p class="text-muted">${escapeHtml(spazio.descrizione || "")}</p>
        <ul class="list-unstyled">
          ${sedeRiga}
          ${tipologiaRiga}
          <li><strong>Capienza:</strong> ${cap}</li>
          <li><strong>Prezzo orario:</strong> ${prezzo}</li>
          <li id="riga-servizi"><strong>Servizi:</strong> <span id="serviziList" class="text-muted">Caricamento…</span></li>
        </ul>

        <a href="carrello.html?spazio=${spazio.id}" class="btn btn-primary btn-lg mt-2">
          <i class="fa-solid fa-cart-shopping me-2"></i>Prenota
        </a>
      </div>
    </div>
  `;

    $("#dettaglioSpazio").html(html);

    caricaServiziSpazio(spazio.id);
  }

  function caricaServiziSpazio(idSpazio) {
  $.ajax({
    url: `${API_SERVIZI}/bySpazio/${idSpazio}`,
    type: "GET",
    headers: { Authorization: "Bearer " + token },
  })
  .done(function (lista) {
    const servizi = Array.isArray(lista) ? lista : [];
    const $target = $("#serviziList");
    if (!servizi.length) {
      $target.text("Nessun servizio specificato");
      return;
    }
    const nomi = servizi
      .map(s => (s && s.nome ? String(s.nome) : null))
      .filter(Boolean)
      .map(escapeHtml);

    $target.text(nomi.length ? nomi.join(", ") : "Nessun servizio specificato");
  })
  .fail(function () {
    $("#serviziList").text("Nessun servizio specificato");
  });
}


});
