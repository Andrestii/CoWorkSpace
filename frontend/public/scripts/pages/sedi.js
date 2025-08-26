// scripts/pages/sedi.js
$(function () {
  const API = apiConfig.apiUrl;
  const token = localStorage.getItem("authToken");

  // ---- Stato ----
  let tutteLeSedi = [];
  let tuttiGliSpazi = [];
  let serviziCatalogo = [];
  let spaziDisponibiliInData = new Set(); // id_spazio con almeno 1 slot disponibile nel giorno
  const cacheDisponibilitaPerGiorno = new Map(); // 'YYYY-MM-DD' -> Set(ids)
  let DATE_SELECTED = ""; // stringa 'YYYY-MM-DD' se l'utente ha scelto una data

  // ---- UI init ----
  $("#errore").addClass("d-none");
  $("#sedi-container").empty();
  $("#loading").show();

  // ---- Fetch iniziali ----
  const ajaxSedi = $.ajax({
    url: `${API}/sedi/getAllSedi`,
    method: "GET",
    headers: { Authorization: "Bearer " + token }
  });
  const ajaxSpazi = $.ajax({
    url: `${API}/spazi/getSpazi`,
    method: "GET",
    headers: { Authorization: "Bearer " + token }
  });
  const ajaxServizi = $.ajax({
    url: `${API}/servizi/getServizi`,
    method: "GET",
    headers: { Authorization: "Bearer " + token }
  });

  $.when(ajaxSedi, ajaxSpazi, ajaxServizi)
    .done((resSedi, resSpazi, resServizi) => {
      tutteLeSedi = Array.isArray(resSedi[0]) ? resSedi[0] : [];
      tuttiGliSpazi = Array.isArray(resSpazi[0]) ? resSpazi[0] : [];
      serviziCatalogo = Array.isArray(resServizi[0]) ? resServizi[0] : [];

      popolaFiltroCitta(tutteLeSedi);
      popolaFiltroServizi(serviziCatalogo);

      const serviziInSpazi = tuttiGliSpazi.some(sp => Array.isArray(sp.servizi) && sp.servizi.length);
      $("#filtroServizi").prop("disabled", !serviziInSpazi);
      $("#noteServizi")[serviziInSpazi ? "addClass" : "removeClass"]("d-none");

      renderSedi(tutteLeSedi);

      $("#filtroData, #filtroCitta, #filtroTipologia, #filtroServizi, #filtroDisponibilita")
        .on("change", onFiltersChange);
    })
    .fail((xhr) => {
      const msg = xhr?.responseJSON?.error || xhr?.responseJSON?.message || "Errore nel caricamento dei dati.";
      $("#errore").removeClass("d-none").text(msg);
    })
    .always(() => $("#loading").hide());

  // ---- Cambio filtri ----
  function onFiltersChange() {
    const dataSelezionata = $("#filtroData").val(); // YYYY-MM-DD
    DATE_SELECTED = dataSelezionata || "";

    if (DATE_SELECTED) {
      caricaDisponibilitaPerGiorno(DATE_SELECTED).then(applicaFiltri);
    } else {
      spaziDisponibiliInData = new Set();
      applicaFiltri();
    }
  }

  // --------- CORE: disponibilità per giorno ----------
  // Batch helper per limitare il parallelismo
  async function inBatches(items, size, worker) {
    const out = [];
    for (let i = 0; i < items.length; i += size) {
      const chunk = items.slice(i, i + size).map(worker);
      const res = await Promise.allSettled(chunk);
      out.push(...res);
    }
    return out;
  }

  // Chiede le disponibilità di UNO spazio
  async function fetchDispSpazio(spazioId) {
    try {
      const rows = await $.ajax({
        url: `${API}/disponibilita/list`,
        method: "GET",
        data: { id_spazio: spazioId },
        headers: { Authorization: "Bearer " + token }
      });
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  // Almeno uno slot disponibile in quel giorno?
  function hasSlotThatDay(rows, yyyy_mm_dd) {
    const sameDay = (iso) => String(iso || "").slice(0, 10) === yyyy_mm_dd;
    for (const r of rows) {
      const disponibile = (r?.disponibile !== false); // true se mancante
      if (disponibile && sameDay(r?.start_at)) return true;
    }
    return false;
  }

  // Interroga /disponibilita/list per OGNI spazio (batch)
  async function caricaDisponibilitaPerGiorno(yyyy_mm_dd) {
    if (cacheDisponibilitaPerGiorno.has(yyyy_mm_dd)) {
      spaziDisponibiliInData = cacheDisponibilitaPerGiorno.get(yyyy_mm_dd);
      return;
    }

    const idsSpazi = (tuttiGliSpazi || []).map(sp => Number(sp.id)).filter(Number.isFinite);
    const ok = new Set();

    // batch di 8 richieste per volta
    await inBatches(idsSpazi, 8, async (sid) => {
      const rows = await fetchDispSpazio(sid);
      if (hasSlotThatDay(rows, yyyy_mm_dd)) ok.add(sid);
    });

    spaziDisponibiliInData = ok;
    cacheDisponibilitaPerGiorno.set(yyyy_mm_dd, ok);
  }

  // ---- Applica filtri ----
  function applicaFiltri() {
    const citta = $("#filtroCitta").val();
    const tipologia = $("#filtroTipologia").val();
    const servizio = $("#filtroServizi").val();
    const $dispSel = $("#filtroDisponibilita");
    const dispSede = $dispSel.length ? $dispSel.val() : ""; // attiva | non_attiva | ""

    let filtrate = [...tutteLeSedi];

    // Città
    if (citta) {
      filtrate = filtrate.filter(s => (s.citta || "").toLowerCase() === citta.toLowerCase());
    }

    // Stato sede
    if (dispSede === "attiva") filtrate = filtrate.filter(s => !!s.attiva);
    if (dispSede === "non_attiva") filtrate = filtrate.filter(s => !s.attiva);

    // Join con spazi
    const spaziBySede = groupBy(tuttiGliSpazi, "id_sede");

    filtrate = filtrate.filter(sede => {
      let spazi = spaziBySede.get(sede.id) || [];

      if (tipologia) {
        spazi = spazi.filter(sp => (sp.tipologia || "").toLowerCase() === tipologia.toLowerCase());
      }

      if (servizio) {
        spazi = spazi.filter(sp =>
          Array.isArray(sp.servizi) &&
          sp.servizi.map(x => String(x).toLowerCase()).includes(servizio.toLowerCase())
        );
      }

      // Data → se una data è selezionata, filtra SEMPRE contro il Set
      if (DATE_SELECTED) {
        spazi = spazi.filter(sp => {
          const idNorm = Number(sp.id ?? sp.ID ?? sp.id_spazio ?? sp.spazio_id ?? sp.idSpazio);
          return spaziDisponibiliInData.has(idNorm);
        });
      }

      return spazi.length > 0;
    });

    renderSedi(filtrate);
  }

  // ---- Render ----
  function renderSedi(lista) {
    const $wrap = $("#sedi-container");
    $wrap.empty();

    if (!Array.isArray(lista) || lista.length === 0) {
      const extra = DATE_SELECTED
        ? `<div class="alert alert-warning" role="alert">
             Nessuna sede con spazi disponibili per la data selezionata.
           </div>`
        : "";
      $wrap.html(`${extra}<p class="text-center">Nessuna sede trovata con i filtri selezionati.</p>`);
      return;
    }

    lista.forEach(sede => {
      const img = sede.immagine || "https://via.placeholder.com/400x250?text=Sede";
      const badge = sede.attiva
        ? '<span class="badge bg-success ms-2">Attiva</span>'
        : '<span class="badge bg-secondary ms-2">Non attiva</span>';

      const html = `
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <img src="${img}" class="card-img-top" alt="${escapeHtml(sede.nome || "Sede")}">
            <div class="card-body">
              <h5 class="card-title d-flex align-items-center justify-content-between">
                <span>${escapeHtml(sede.nome || "Sede")}</span>
                ${badge}
              </h5>
              <p class="card-text text-muted mb-2">
                ${escapeHtml(sede.indirizzo || "")}${sede.citta ? `, ${escapeHtml(sede.citta)}` : ""}
              </p>
              <a class="btn btn-outline-primary" href="sede.html?id=${sede.id}">
                <i class="fa-solid fa-circle-info me-1"></i> Dettagli
              </a>
            </div>
          </div>
        </div>`;
      $wrap.append(html);
    });
  }

  // ---- Select helper ----
  function popolaFiltroCitta(sedi) {
    const $sel = $("#filtroCitta");
    $sel.empty().append('<option value="">Tutte</option>');
    const uniche = Array.from(new Set((sedi || []).map(s => (s.citta || "").trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
    uniche.forEach(c => $sel.append(`<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`));
    $sel.prop("disabled", false);
  }

  function popolaFiltroServizi(servizi) {
    const $sel = $("#filtroServizi");
    $sel.empty().append('<option value="">Tutti</option>');
    if (!Array.isArray(servizi) || servizi.length === 0) return;
    servizi
      .filter(s => s && (s.nome || s.label))
      .sort((a, b) => (a.nome || a.label).localeCompare((b.nome || b.label), "it", { sensitivity: "base" }))
      .forEach(s => {
        const nome = s.nome || s.label;
        $sel.append(`<option value="${escapeAttr(String(nome))}">${escapeHtml(String(nome))}</option>`);
      });
  }

  // ---- Helpers ----
  function groupBy(arr, key) {
    const map = new Map();
    (arr || []).forEach(item => {
      const k = item[key];
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    });
    return map;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }
});
