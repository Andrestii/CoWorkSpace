// ./scripts/pages/sedi.js
$(document).ready(function () {
    const apiBase = apiConfig.apiUrl + '/sedi';
    const token = localStorage.getItem('authToken');

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

            if (!sedi || sedi.length === 0) {
                $('#sedi-container').html('<p class="text-center">Nessuna sede disponibile.</p>');
                return;
            }

            sedi.forEach(sede => {
                const imgSrc = sede.immagine || 'https://via.placeholder.com/400x250?text=Sede';
                const cardHtml = `
                                    <div class="col-md-4">
                                    <div class="card h-100 shadow-sm">
                                        <img src="${imgSrc}" class="card-img-top" alt="${sede.nome}">
                                        <div class="card-body">
                                        <h5 class="card-title">${sede.nome}</h5>
                                        <p class="card-text text-muted">${sede.indirizzo}, ${sede.citta}</p>
                                        <a href="sede.html?id=${sede.id}" class="btn btn-outline-primary mt-2">
                                            <i class="fa-solid fa-circle-info me-1"></i> Dettagli
                                        </a>
                                        </div>
                                    </div>
                                    </div>
                                    `;

                $('#sedi-container').append(cardHtml);
            });
        })
        .fail(function (xhr) {
            $('#loading').hide();
            let msg = 'Errore nel caricamento delle sedi.';
            if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
                msg = xhr.responseJSON.error || xhr.responseJSON.message;
            }
            $('#errore').removeClass('d-none').text(msg);
        });
});
