// ./scripts/pages/sede.js
$(document).ready(function () {
    const apiBase = apiConfig.apiUrl + '/sedi';
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

    $.ajax({
        url: `${apiBase}/getAllSedi/${sedeId}`,
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
        })
        .fail(function (xhr) {
            $('#loading').hide();
            let msg = 'Errore nel caricamento della sede.';
            if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
                msg = xhr.responseJSON.error || xhr.responseJSON.message;
            }
            $('#errore').removeClass('d-none').text(msg);
        });
});
