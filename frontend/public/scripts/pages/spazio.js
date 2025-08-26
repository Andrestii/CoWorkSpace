// frontend/public/scripts/pages/spazio.js
$(document).ready(function () {
  const API_SPAZI = `${apiConfig.apiUrl}/spazi`;
  const API_SEDI = `${apiConfig.apiUrl}/sedi`;
  const token = localStorage.getItem("authToken");

  const params = new URLSearchParams(window.location.search);
  const spazioId = Number(params.get("id"));

  if (!spazioId) {
    $("#loading").hide();
    $("#errore").removeClass("d-none").text("ID spazio mancante.");
    return;
  }

  // Helpers stile identico a sede.js
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

  // Carico lista spazi (backend invariato) e filtro per id
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

      // Se disponibile, carica dati della sede per mostrare indirizzo come in sede.html
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

    // Riga sede (nome + indirizzo)
    const sedeRiga = sede ? `
    <li>
      <i class="fa-solid fa-building me-2"></i>
      <a href="sede.html?id=${sede.id}">${escapeHtml(sede.nome || "Sede")}</a>
      ${sede.attiva ? '<span class="badge bg-success ms-2">Attiva</span>' : '<span class="badge bg-secondary ms-2">Non attiva</span>'}
    </li>
    <li>
      <i class="fa-solid fa-location-dot me-2"></i>
      ${escapeHtml(sede.indirizzo || "")}${sede.citta ? ", " + escapeHtml(sede.citta) : ""}
    </li>
  ` : "";

    // Riga tipologia (subito sotto indirizzo)
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
        </ul>

        <a href="carrello.html?spazio=${spazio.id}" class="btn btn-primary btn-lg mt-2">
          <i class="fa-solid fa-cart-shopping me-2"></i>Prenota
        </a>
      </div>
    </div>
  `;

    $("#dettaglioSpazio").html(html);
  }

});
