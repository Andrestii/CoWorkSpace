// ./scripts/pages/sedi.js
$(document).ready(function () {
  const apiBase = apiConfig.apiUrl + '/sedi';
  const token = localStorage.getItem('authToken');
  let tutteLeSedi = []; // cache per filtri

  if (!token) {
    alert('Devi effettuare il login per vedere le sedi.');
    window.location.href = 'login.html';
    return;
  }

  $('#loading').show();
  $('#errore').addClass('d-none');
  $('#sedi-container').empty();

  $.ajax({
    url: `${apiBase}/getAllSedi`,
    type: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .done(function (sedi) {
      $('#loading').hide();

      if (!Array.isArray(sedi) || sedi.length === 0) {
        $('#sedi-container').html('<p class="text-center">Nessuna sede disponibile.</p>');
        // anche il filtro rimane disabilitato perché non ci sono regioni
        return;
      }

      tutteLeSedi = sedi;

      // Popola dinamicamente le regioni uniche
      populateRegionFilter(getUniqueRegions(tutteLeSedi));

      // Render iniziale (tutte)
      renderSedi(tutteLeSedi);
    })
    .fail(function (xhr) {
      $('#loading').hide();
      let msg = 'Errore nel caricamento delle sedi.';
      if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
        msg = xhr.responseJSON.error || xhr.responseJSON.message;
      }
      $('#errore').removeClass('d-none').text(msg);
    });

  // Cambio filtro
  $('#filtroRegione').on('change', function () {
    const regioneSelezionata = $(this).val();
    if (!regioneSelezionata) {
      renderSedi(tutteLeSedi);
      return;
    }
    const filtrate = tutteLeSedi.filter(s => normalizeRegion(s.regione) === regioneSelezionata);
    renderSedi(filtrate);
  });

  // --- Helpers ---

  function renderSedi(lista) {
    $('#sedi-container').empty();
    if (!lista || lista.length === 0) {
      $('#sedi-container').html('<p class="text-center">Nessuna sede trovata per questa regione.</p>');
      return;
    }

    lista.forEach(sede => {
      const imgSrc = sede.immagine || 'https://via.placeholder.com/400x250?text=Sede';
      const regione = sede.regione || '';
      const cardHtml = `
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <img src="${imgSrc}" class="card-img-top" alt="${sede.nome}">
            <div class="card-body">
              <h5 class="card-title">${sede.nome}</h5>
              <p class="card-text text-muted">${sede.indirizzo}, ${sede.citta}${regione ? ' (' + regione + ')' : ''}</p>
              <a href="sede.html?id=${sede.id}" class="btn btn-outline-primary mt-2">
                <i class="fa-solid fa-circle-info me-1"></i> Dettagli
              </a>
            </div>
          </div>
        </div>`;
      $('#sedi-container').append(cardHtml);
    });
  }

  function populateRegionFilter(regioniUniche) {
    const $sel = $('#filtroRegione');
    $sel.empty();

    // Opzione "tutte"
    $sel.append(`<option value="">Tutte le regioni</option>`);

    // Aggiunta opzioni ordinate alfabeticamente
    regioniUniche.sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
      .forEach(r => {
        $sel.append(`<option value="${r}">${r}</option>`);
      });

    $sel.prop('disabled', false);
  }

  function getUniqueRegions(sedi) {
    const set = new Set();
    sedi.forEach(s => {
      const norm = normalizeRegion(s.regione);
      if (norm) set.add(norm);
    });
    return Array.from(set);
  }

  function normalizeRegion(value) {
    if (!value) return '';
    return String(value).trim()
      .replace(/\s+/g, ' ')       // spazi multipli -> singolo spazio
      .replace(/(^.|\s.)/g, m => m.toUpperCase()) // capitalizza ogni parola
      .toLowerCase()              // abbassa
      .replace(/(^|\s)\S/g, t => t.toUpperCase()); // poi ricapitalizza l'iniziale
    // NB: sopra assicuriamo coerenza in visual e come value delle option
  }
});
