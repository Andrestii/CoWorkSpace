// frontend/public/scripts/pages/sede.js
$(document).ready(function () {
  const API_SEDI = `${apiConfig.apiUrl}/sedi`;
  const API_SPAZI = `${apiConfig.apiUrl}/spazi`;
  const token = localStorage.getItem("authToken");

  const params = new URLSearchParams(window.location.search);
  const sedeId = params.get("id");

  if (!sedeId) {
    $("#loading").hide();
    $("#errore").removeClass("d-none").text("ID sede mancante.");
    return;
  }

  // ====== STATE / CACHE ======
  let SPAZI_CACHE = [];
  let sedeImgDefault = null;

  // ====== UTILS ======
  function capitalizeTipologia(tipologia) {
    if (!tipologia) return "";
    return tipologia
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  function ensureFiltersUI() {
    // Se il filtro non è presente in DOM, lo iniettiamo subito sopra le card
    if (!$("#fTipologia").length) {
      const filterHtml = `
        <div class="row align-items-center mb-3" id="spaziFilters">
          <div class="col-auto">
            <label for="fTipologia" class="form-label mb-0 me-2">Tipologia:</label>
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <select id="fTipologia" class="form-select form-select-sm">
              <option value="">Tutte le tipologie</option>
            </select>
          </div>
        </div>`;
      // Inserisce il filtro appena sopra la griglia #spaziSede
      $("#spaziWrapper #spaziSede").before(filterHtml);
    }
  }

  // ====== RENDER ======
  function renderCardSpazio(spazio) {
    // Fallback immagine: spazio > sede > placeholder
    const img =
      spazio.immagine ||
      sedeImgDefault ||
      "https://via.placeholder.com/800x500?text=Spazio";
    const cap = Number.isFinite(spazio.capienza)
      ? `${spazio.capienza} posti`
      : "—";
    const prezzo =
      spazio.prezzo_orario != null
        ? `${Number(spazio.prezzo_orario).toFixed(2)} € / h`
        : "—";

    const labelTipologia = capitalizeTipologia(spazio.tipologia);
    const badge = labelTipologia
      ? `<span class="badge badge-tipologia">${labelTipologia}</span>`
      : "";

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <img src="${img}" class="card-img-top" alt="${spazio.nome}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-1">${spazio.nome}</h5>
            <div class="mb-2 small text-muted">${badge}</div>
            <p class="card-text mb-2"><i class="fa-regular fa-user me-1"></i>${cap}</p>
            <p class="card-text fw-semibold text-primary">${prezzo}</p>
            <div class="mt-auto">
              <a href="spazio.html?id=${spazio.id}" class="btn btn-outline-primary w-100">Dettagli</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSpaziFiltrati() {
    const selected = $("#fTipologia").val(); // '', 'postazione', 'ufficio', 'sala_riunioni'
    const list = selected
      ? SPAZI_CACHE.filter((s) => s.tipologia === selected)
      : SPAZI_CACHE;

    if (!list.length) {
      $("#spaziSede").html(`
        <div class="col-12">
          <div class="alert alert-warning mb-0">Nessuno spazio per la tipologia selezionata.</div>
        </div>
      `);
      return;
    }

    $("#spaziSede").html(list.map(renderCardSpazio).join(""));
  }

  function populateTipologiaFilter() {
    ensureFiltersUI();
    const tipi = [...new Set(SPAZI_CACHE.map((s) => s.tipologia).filter(Boolean))];
    const $sel = $("#fTipologia");
    // pulizia opzioni precedenti (mantieni "Tutte le tipologie")
    $sel.find('option:not([value=""])').remove();

    tipi.forEach((t) => {
      $sel.append(`<option value="${t}">${capitalizeTipologia(t)}</option>`);
    });
  }

  // ====== DATA FETCH ======
  // 1) Carica dettaglio sede
  $.ajax({
    url: `${API_SEDI}/getAllSedi/${sedeId}`,
    type: "GET",
    headers: { Authorization: "Bearer " + token },
  })
    .done(function (sede) {
      $("#loading").hide();

      if (!sede || !sede.id) {
        $("#errore").removeClass("d-none").text("Sede non trovata.");
        return;
      }

      $("#sedeNome").text(sede.nome);

      const imgSrc =
        sede.immagine || "https://via.placeholder.com/1200x600?text=Sede";
      sedeImgDefault = sede.immagine || null;

      const badge = sede.attiva
        ? '<span class="badge bg-success">Attiva</span>'
        : '<span class="badge bg-secondary">Non attiva</span>';

      const html = `
        <div class="row g-4">
          <div class="col-lg-6">
            <img src="${imgSrc}" class="img-fluid rounded shadow-sm" alt="${sede.nome}">
          </div>
          <div class="col-lg-6">
            <h2>${sede.nome} ${badge}</h2>
            <p class="text-muted">${sede.descrizione || ""}</p>
            <ul class="list-unstyled">
              <li><i class="fa-solid fa-location-dot me-2"></i>${sede.indirizzo || ""}${sede.citta ? ", " + sede.citta : ""}</li>
              <li><strong>Provincia:</strong> ${sede.provincia || "-"}</li>
              <li><strong>CAP:</strong> ${sede.cap || "-"}</li>
              <li><strong>Regione:</strong> ${sede.regione || "-"}</li>
              <li><strong>Coordinate:</strong> ${sede.latitudine ?? "-"}, ${sede.longitudine ?? "-"}</li>
            </ul>
          </div>
        </div>
      `;
      $("#dettaglioSede").html(html);

      // 2) Dopo il dettaglio, carica gli spazi della sede
      caricaSpaziDellaSede(sede.id);
    })
    .fail(function (xhr) {
      $("#loading").hide();
      let msg = "Errore nel caricamento della sede.";
      if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
        msg = xhr.responseJSON.error || xhr.responseJSON.message;
      }
      $("#errore").removeClass("d-none").text(msg);
    });

  function caricaSpaziDellaSede(idSede) {
    $("#spaziLoading").show();
    $("#spaziErrore").addClass("d-none").text("");
    $("#spaziSede").empty();

    $.ajax({
      url: `${API_SPAZI}/getSpazi?sede=${idSede}`,
      type: "GET",
      headers: { Authorization: "Bearer " + token },
    })
      .done(function (spazi) {
        $("#spaziLoading").hide();
        SPAZI_CACHE = Array.isArray(spazi) ? spazi : [];

        if (!SPAZI_CACHE.length) {
          $("#spaziSede").html(`
            <div class="col-12">
              <div class="alert alert-warning mb-0">Al momento non ci sono spazi pubblicati per questa sede.</div>
            </div>
          `);
          return;
        }

        // Popola filtro tipologia e primo render
        populateTipologiaFilter();
        renderSpaziFiltrati();
      })
      .fail(function (xhr) {
        $("#spaziLoading").hide();
        let msg = "Errore nel caricamento degli spazi.";
        if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
          msg = xhr.responseJSON.error || xhr.responseJSON.message;
        }
        $("#spaziErrore").removeClass("d-none").text(msg);
      });
  }

  // ====== LISTENERS ======
  $(document).on("change", "#fTipologia", renderSpaziFiltrati);
});
