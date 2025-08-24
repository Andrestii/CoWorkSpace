// ./scripts/pages/spazi.js
$(document).ready(function () {
  const apiBase = apiConfig.apiUrl + '/spazi';
  const token = localStorage.getItem('authToken'); // non obbligatorio per GET
  const urlParams = new URLSearchParams(location.search);
  const sedeFilter = urlParams.get('sede'); // opzionale: /spazi.html?sede=ID

  let tuttiGliSpazi = [];

  $('#loading').show();
  $('#errore').addClass('d-none');
  $('#spazi-container').empty();

  // compongo URL GET
  const qs = sedeFilter ? ('?sede=' + encodeURIComponent(sedeFilter)) : '';
  $.ajax({
    url: `${apiBase}/getSpazi${qs}`,
    type: 'GET',
    headers: token ? { 'Authorization': 'Bearer ' + token } : undefined
  })
  .done(function (spazi) {
    $('#loading').hide();

    if (!Array.isArray(spazi) || spazi.length === 0) {
      $('#spazi-container').html('<p class="text-center">Nessuno spazio disponibile.</p>');
      return;
    }

    tuttiGliSpazi = spazi;

    // popola filtro tipologia
    populateTipologiaFilter(getUniqueTipologie(tuttiGliSpazi));

    // render iniziale
    renderSpazi(tuttiGliSpazi);
  })
  .fail(function (xhr) {
    $('#loading').hide();
    let msg = 'Errore nel caricamento degli spazi.';
    if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
      msg = xhr.responseJSON.error || xhr.responseJSON.message;
    }
    $('#errore').removeClass('d-none').text(msg);
  });

  // Filtro
  $('#filtroTipologia').on('change', function () {
    const tip = $(this).val();
    if (!tip) {
      renderSpazi(tuttiGliSpazi);
      return;
    }
    const filtrati = tuttiGliSpazi.filter(s => normalizeTipologia(s.tipologia) === tip);
    renderSpazi(filtrati);
  });

  // ---- Helpers ----

  function renderSpazi(lista) {
    $('#spazi-container').empty();
    if (!lista || lista.length === 0) {
      $('#spazi-container').html('<p class="text-center">Nessuno spazio trovato per questo filtro.</p>');
      return;
    }

    lista.forEach(spazio => {
      const img = spazio.immagine || 'https://via.placeholder.com/800x500?text=Spazio';
      const tip = formatTipologia(spazio.tipologia);
      const cap = Number.isFinite(spazio.capienza) ? `${spazio.capienza} posti` : '—';
      const prezzo = (spazio.prezzo_orario != null) ? `${Number(spazio.prezzo_orario).toFixed(2)} € / h` : '—';

      const card = `
        <div class="col-md-4">
          <div class="card h-100 shadow-sm prodotto-card">
            <div class="pc-card-img">
              <img src="${img}" class="card-img-top" alt="${escapeHtml(spazio.nome)}">
            </div>
            <div class="card-body">
              <h5 class="card-title mb-1">${escapeHtml(spazio.nome)}</h5>
              <div class="mb-2">
                <span class="badge badge-tipologia">${tip}</span>
              </div>
              <p class="card-text text-muted mb-2">
                <i class="fa-solid fa-users me-1"></i>${cap}
              </p>
              <p class="card-text fw-semibold text-primary">${prezzo}</p>
              <a href="spazio.html?id=${spazio.id}" class="btn btn-outline-primary mt-1">
                <i class="fa-solid fa-circle-info me-1"></i> Dettagli
              </a>
            </div>
          </div>
        </div>
      `;
      $('#spazi-container').append(card);
    });
  }

  function populateTipologiaFilter(tipologie) {
  const $sel = $('#filtroTipologia');
  $sel.empty();
  $sel.append(`<option value="">Tutte le tipologie</option>`);

  tipologie
    .sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
    .forEach(t => {
      const label = t.charAt(0).toUpperCase() + t.slice(1); // prima lettera maiuscola
      $sel.append(`<option value="${t}">${label}</option>`);
    });

  $sel.prop('disabled', false);
}


  function getUniqueTipologie(spazi) {
    const set = new Set();
    spazi.forEach(s => {
      const norm = normalizeTipologia(s.tipologia);
      if (norm) set.add(norm);
    });
    return Array.from(set);
  }

  function normalizeTipologia(val) {
    if (!val) return '';
    return String(val).trim().toLowerCase().replace(/_/g, ' '); // valore usato nel filter
  }

  function formatTipologia(val) {
    const clean = normalizeTipologia(val);
    // Prima lettera maiuscola, resto invariato (manteniamo la rimozione underscore)
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }
});
