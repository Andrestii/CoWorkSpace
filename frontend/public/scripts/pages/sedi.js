// scripts/sedi.js
$(document).ready(function () {
   const apiUrl = apiConfig.apiUrl; // URL del backend

    // Funzione per caricare le sedi
    function caricaSedi() {
        const token = localStorage.getItem('authToken'); // recupera il token salvato

        if (!token) {
            alert('Devi effettuare il login per vedere le sedi.');
            window.location.href = 'login.html';
            return;
        }

        $.ajax({
            url: apiUrl + '/sedi/getAllSedi', // endpoint corretto
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function (response) {
                $('#sedi-container').empty();

                if (!response || response.length === 0) {
                    $('#sedi-container').html('<p>Nessuna sede disponibile.</p>');
                    return;
                }

                // Cicliamo le sedi e aggiungiamo HTML dinamico
                response.forEach(sede => {
                    const sedeHtml = `
                        <div class="card mb-3">
                            <img src="${sede.immagine_url}" class="card-img-top" alt="${sede.nome}">
                            <div class="card-body">
                                <h5 class="card-title">${sede.nome}</h5>
                                <p class="card-text">${sede.indirizzo}</p>
                                <p class="card-text"><small class="text-muted">${sede.citta}</small></p>
                            </div>
                        </div>
                    `;
                    $('#sedi-container').append(sedeHtml);
                });
            },
            error: function (xhr) {
                let errorMsg = 'Errore nel caricamento delle sedi.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                $('#sedi-container').html(`<p class="text-danger">${errorMsg}</p>`);
            }
        });
    }

    // Chiamata iniziale
    caricaSedi();
});
