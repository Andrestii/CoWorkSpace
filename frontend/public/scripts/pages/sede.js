// ./scripts/pages/sede.js
$(document).ready(function () {
  const apiSedi = apiConfig.apiUrl + '/sedi';
  const apiSpazi = apiConfig.apiUrl + '/spazi';
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('Devi effettuare il login per vedere i dettagli della sede.');
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const sedeId = params.get('id');

  if (!sedeId) {
    $('#loading').hide();
    $('#errore').removeClass('d-none').text('ID sede mancante.');
    return;
  }

  // 1) Carica dettaglio sede
  $.ajax({
    url: `${apiSedi}/getAllSedi/${sedeId}`,
    type: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .done(function (sede) {
    $('#loading').hide();

    if (!sede || !sede.id) {
      $('#errore').removeClass('d-none').text('Sede non trovata.');
      return;
    }

    $('#sedeNome').text(sede.nome);

    const imgSrc = sede.immagine || 'https://via.placeholder.com/1200x600?text=Sede';
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
          <p class="text-muted">${sede.descrizione || ''}</p>
          <ul class="list-unstyled">
            <li><i class="fa-solid fa-location-dot me-2"></i>${sede.indirizzo}, ${sede.citta}</li>
            <li><strong>Provincia:</strong> ${sede.provincia || '-'}</li>
            <li><strong>CAP:</strong> ${sede.cap || '-'}</li>
            <li><strong>Regione:</strong> ${sede.regione || '-'}</li>
            <li><strong>Coordinate:</strong> ${sede.latitudine ?? '-'}, ${sede.longitudine ?? '-'}</li>
          </ul>
        </div>
      </div>
    `;
    $('#dettaglioSede').html(html);

caricaSpaziDellaSede(sede.id);

function caricaSpaziDellaSede(idSede) {
  $('#spaziLoading').show();
  $('#spaziErrore').addClass('d-none').text('');
  $('#spaziSede').empty();

  $.ajax({
    url: apiConfig.apiUrl + `/spazi/getSpazi?sede=${idSede}`,
    type: 'GET',
    headers: { 'Authorization': 'Bearer ' + token } // ok anche se l'endpoint non la richiede
  })
  .done(function (spazi) {
    $('#spaziLoading').hide();
    if (!Array.isArray(spazi) || spazi.length === 0) {
      $('#spaziSede').html(`
        <div class="col-12">
          <div class="alert alert-warning mb-0">Al momento non ci sono spazi pubblicati per questa sede.</div>
        </div>
      `);
      return;
    }
    const cards = spazi.map(renderCardSpazio).join('');
    $('#spaziSede').html(cards);
  })
  .fail(function (xhr) {
    $('#spaziLoading').hide();
    let msg = 'Errore nel caricamento degli spazi.';
    if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
      msg = xhr.responseJSON.error || xhr.responseJSON.message;
    }
    $('#spaziErrore').removeClass('d-none').text(msg);
  });
}

function renderCardSpazio(spazio) {
  const img = spazio.immagine || './assets/images/default-spazio.jpg'; // Da aggiungere default-spazio.jpg
  const cap = Number.isFinite(spazio.capienza) ? `${spazio.capienza} posti` : '—';
  const prezzo = (spazio.prezzo_orario != null) ? `${Number(spazio.prezzo_orario).toFixed(2)} € / h` : '—';
  const labelTipologia = spazio.tipologia  ? spazio.tipologia.charAt(0).toUpperCase() + spazio.tipologia.slice(1).toLowerCase()  : '';
  const badge = spazio.tipologia ? `<span class="badge badge-tipologia">${labelTipologia.replace('_',' ')}</span>` : '';

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

    // 2) Dopo il dettaglio, carica gli spazi della sede
    caricaSpaziDellaSede(sede.id);
  })
  .fail(function (xhr) {
    $('#loading').hide();
    let msg = 'Errore nel caricamento della sede.';
    if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
      msg = xhr.responseJSON.error || xhr.responseJSON.message;
    }
    $('#errore').removeClass('d-none').text(msg);
  });

  // ===== Funzioni =====
  function caricaSpaziDellaSede(idSede) {
    $('#spaziLoading').show();
    $('#spaziErrore').addClass('d-none').text('');
    $('#spaziSede').empty();

    $.ajax({
      url: `${apiSpazi}/bySede/${idSede}`,   // vedi backend sotto
      type: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .done(function (spazi) {
      $('#spaziLoading').hide();
      if (!Array.isArray(spazi) || spazi.length === 0) {
        $('#spaziSede').html(`
          <div class="col-12">
            <div class="alert alert-warning mb-0">Al momento non ci sono spazi pubblicati per questa sede.</div>
          </div>
        `);
        return;
      }

      const cards = spazi.map(renderCardSpazio).join('');
      $('#spaziSede').html(cards);
    })
    .fail(function (xhr) {
      $('#spaziLoading').hide();
      let msg = 'Errore nel caricamento degli spazi.';
      if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
        msg = xhr.responseJSON.error || xhr.responseJSON.message;
      }
      $('#spaziErrore').removeClass('d-none').text(msg);
    });
  }

  function renderCardSpazio(spazio) {
    const img = spazio.immagine || 'https://via.placeholder.com/800x500?text=Spazio';
    const tipologiaBadge = spazio.tipologia
      ? `<span class="badge bg-outline border text-uppercase">${spazio.tipologia.replace('_',' ')}</span>`
      : '';
    const cap = Number.isFinite(spazio.capienza) ? `${spazio.capienza} posti` : '—';
    const prezzo = (spazio.prezzo_orario != null) ? `${Number(spazio.prezzo_orario).toFixed(2)} € / h` : '—';

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card prodotto-card h-100 shadow-sm">
          <img src="${img}" class="card-img-top" alt="${spazio.nome}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-1">${spazio.nome}</h5>
            <div class="mb-2 small text-muted">${tipologiaBadge}</div>
            <p class="card-text mb-2"><i class="fa-regular fa-user me-1"></i>${cap}</p>
            <p class="card-text fw-semibold text-primary">${prezzo}</p>
            <div class="mt-auto">
              <a href="spazio.html?id=${spazio.id}" class="btn btn-outline-primary w-100">
                Dettagli
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
});
