// scripts/pages/sedi.js
$(function () {
  const API = apiConfig.apiUrl;
  const token = localStorage.getItem("authToken");

  // Cache
  let tutteLeSedi = [];     // sedi base
  let tuttiGliSpazi = [];   // spazi di tutte le sedi
  let serviziCatalogo = []; // lista servizi (catalogo)
  let spaziDisponibiliInData = new Set(); // id_spazio con slot disponibili nel giorno selezionato

  // UI init
  $("#errore").addClass("d-none");
  $("#sedi-container").empty();
  $("#loading").show();

  // Carico sedi, spazi, servizi in parallelo
  const ajaxSedi = $.ajax({ url: `${API}/sedi/getAllSedi`, method: "GET", headers: { Authorization: "Bearer " + token } });
  const ajaxSpazi = $.ajax({ url: `${API}/spazi/getSpazi`, method: "GET", headers: { Authorization: "Bearer " + token } });
  const ajaxServizi = $.ajax({ url: `${API}/servizi/getServizi`, method: "GET", headers: { Authorization: "Bearer " + token } });

  $.when(ajaxSedi, ajaxSpazi, ajaxServizi)
    .done((resSedi, resSpazi, resServizi) => {
      tutteLeSedi = Array.isArray(resSedi[0]) ? resSedi[0] : [];
      tuttiGliSpazi = Array.isArray(resSpazi[0]) ? resSpazi[0] : [];
      serviziCatalogo = Array.isArray(resServizi[0]) ? resServizi[0] : [];

      popolaFiltroCitta(tutteLeSedi);
      popolaFiltroServizi(serviziCatalogo);

      // abilita/disabilita filtro servizi in base al fatto che gli spazi abbiano già un array "servizi"
      const serviziInSpazi = tuttiGliSpazi.some(sp => Array.isArray(sp.servizi) && sp.servizi.length);
      $("#filtroServizi").prop("disabled", !serviziInSpazi);
      $("#noteServizi")[serviziInSpazi ? "addClass" : "removeClass"]("d-none");

      renderSedi(tutteLeSedi);

      // bind filtri (inclusa la Data)
      $("#filtroData, #filtroCitta, #filtroTipologia, #filtroServizi, #filtroDisponibilita").on("change", onFiltersChange);
    })
    .fail((xhr) => {
      const msg = xhr?.responseJSON?.error || xhr?.responseJSON?.message || "Errore nel caricamento dei dati.";
      $("#errore").removeClass("d-none").text(msg);
    })
    .always(() => $("#loading").hide());

  // Quando cambia un filtro:
  function onFiltersChange() {
    const dataSelezionata = $("#filtroData").val(); // YYYY-MM-DD
    if (dataSelezionata) {
      // Scarico gli slot disponibili per quel giorno [data,data]
      caricaDisponibilitaPerGiorno(dataSelezionata).then(applicaFiltri);
    } else {
      // nessuna data: svuoto set e filtro normal
      spaziDisponibiliInData = new Set();
      applicaFiltri();
    }
  }

  // Chiama /disponibilita/range?start=YYYY-MM-DD&end=YYYY-MM-DD
  async function caricaDisponibilitaPerGiorno(yyyy_mm_dd) {
    try {
      const res = await $.ajax({
        url: `${API}/disponibilita/range`,
        method: "GET",
        data: { start: yyyy_mm_dd, end: yyyy_mm_dd }, // stesso giorno
        // NB: in routes non è richiesto auth per /range
      });
      // Costruisco il set di id_spazio con almeno uno slot disponibile (disponibile=true)
      const slots = Array.isArray(res) ? res : [];
      const ok = new Set();
      slots.forEach(sl => {
        if (sl && sl.disponibile && typeof sl.id_spazio !== "undefined") {
          ok.add(sl.id_spazio);
        }
      });
      spaziDisponibiliInData = ok;
    } catch (e) {
      console.error("Errore caricamento disponibilità:", e);
      spaziDisponibiliInData = new Set(); // fallback: nessuna info
    }
  }

  // Applica TUTTI i filtri correnti
  function applicaFiltri() {
    const citta = $("#filtroCitta").val();
    const tipologia = $("#filtroTipologia").val();
    const servizio = $("#filtroServizi").val();
    const dispSede = $("#filtroDisponibilita").val(); // attiva|non_attiva|""

    let filtrate = [...tutteLeSedi];

    // 1) CITTÀ
    if (citta) {
      filtrate = filtrate.filter(s => (s.citta || "").toLowerCase() === citta.toLowerCase());
    }

    // 2) DISPONIBILITÀ sede (flag attiva della sede)
    if (dispSede === "attiva") filtrate = filtrate.filter(s => !!s.attiva);
    if (dispSede === "non_attiva") filtrate = filtrate.filter(s => !s.attiva);

    // 3) TIPOLGIA / SERVIZI / DATA: richiedono join con spazi
    const spaziBySede = groupBy(tuttiGliSpazi, "id_sede");

    filtrate = filtrate.filter(sede => {
      let spazi = spaziBySede.get(sede.id) || [];

      // tipologia (postazione|ufficio|sala_riunioni)
      if (tipologia) {
        spazi = spazi.filter(sp => (sp.tipologia || "").toLowerCase() === tipologia.toLowerCase());
      }

      // servizi (se gli spazi hanno già un array "servizi")
      if (servizio) {
        spazi = spazi.filter(sp => Array.isArray(sp.servizi) && sp.servizi.map(x => String(x).toLowerCase()).includes(servizio.toLowerCase()));
      }

      // data: la sede è valida se ha ALMENO UNO spazio con disponibilità quel giorno
      if (spaziDisponibiliInData.size > 0) {
        spazi = spazi.filter(sp => spaziDisponibiliInData.has(sp.id));
      }

      return spazi.length > 0;
    });

    renderSedi(filtrate);
  }

  // --- Render carte sedi
  function renderSedi(lista) {
    const $wrap = $("#sedi-container");
    $wrap.empty();

    if (!Array.isArray(lista) || lista.length === 0) {
      $wrap.html('<p class="text-center">Nessuna sede trovata con i filtri selezionati.</p>');
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

  // --- Popola select
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

  // --- Helpers
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
    return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }
});