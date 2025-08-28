$(function () {
    $(window).on('scroll', function () {
        if ($(window).scrollTop() > 50) {
            $('.navbar').addClass('shadow-lg');
        } else {
            $('.navbar').removeClass('shadow-lg');
        }
    });

    // Carica 3 sedi random dal backend
    loadFeaturedSedi();

    function loadFeaturedSedi() {
        const url = `${apiConfig.apiUrl}/sedi/getAllSedi`;

        $.ajax({
            url,
            method: 'GET'
        })
            .done(function (sedi) {
                if (!Array.isArray(sedi) || sedi.length === 0) {
                    renderSediCards([]);
                    return;
                }

                const randomThree = pickRandom(sedi, 3);
                renderSediCards(randomThree);
            })
            .fail(function () {
                const fallback = [
                    { id: 0, nome: 'Sede Milano Navigli', indirizzo: 'Via Giovanni B., 12', citta: 'Milano', immagine: null },
                    { id: 0, nome: 'Sede Roma Centro', indirizzo: 'Via delle Arti, 5', citta: 'Roma', immagine: null },
                    { id: 0, nome: 'Sede Bologna Fiera', indirizzo: 'Viale Europa, 20', citta: 'Bologna', immagine: null }
                ];
                renderSediCards(fallback);
            });
    }

    function pickRandom(arr, n) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, Math.min(n, copy.length));
    }

    function renderSediCards(list) {
        const $grid = $('#products').empty();

        if (!list.length) {
            $grid.append(`
        <div class="col-12">
          <p class="text-center text-muted">Nessuna sede disponibile al momento.</p>
        </div>
      `);
            return;
        }

        list.forEach(sede => {
            const img = sede.immagine || 'https://via.placeholder.com/600x360?text=Sede';
            const indirizzo = [sede.indirizzo, sede.citta].filter(Boolean).join(', ');
            const id = sede.id || '';
            $grid.append(`
        <div class="col-lg-4 col-md-6">
          <div class="card h-100 shadow-sm prodotto-card">
            <img src="${img}" class="card-img-top" alt="${escapeHtml(sede.nome || 'Sede')}">
            <div class="card-body">
              <h5 class="card-title mb-1">${escapeHtml(sede.nome || 'Sede')}</h5>
              <p class="card-text text-muted">${escapeHtml(indirizzo)}</p>
              ${id !== ''
                    ? `<a class="btn btn-sm btn-outline-primary mt-2" href="sede.html?id=${id}">
                     <i class="fa-solid fa-circle-info me-1"></i> Dettagli
                   </a>`
                    : `<button class="btn btn-sm btn-outline-secondary mt-2" disabled>Dettagli</button>`
                }
            </div>
          </div>
        </div>
      `);
        });
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, s => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s]
        ));
    }
});
