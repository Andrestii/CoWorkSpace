// Esempio dinamico
$(document).ready(function () {
    if (Auth.isLoggedIn()) {
        $("#registratiButton").remove();
        $("#loginButton").remove();
    }

    // Esempio di sedi (in assenza di API)
    const sediEsempio = [
        {
            id: 101,
            nome: "CoWorkSpace Milano – Porta Nuova",
            citta: "Milano",
            indirizzo: "Via della Moscova 12",
            immagine:
                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60"
        },
        {
            id: 102,
            nome: "CoWorkSpace Roma – Trastevere Hub",
            citta: "Roma",
            indirizzo: "Via dei Riari 25",
            immagine:
                "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60"
        },
        {
            id: 103,
            nome: "CoWorkSpace Torino – San Salvario",
            citta: "Torino",
            indirizzo: "Corso Marconi 18",
            immagine:
                "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1200&q=60"
        }
    ];

    // Prova prima con l'API, se fallisce usa gli esempi
    $.get("/api/sedi/getAllSedi", function (sedi) {
        renderSedi(sedi);
    }).fail(function () {
        renderSedi(sediEsempio);
    });

    if (localStorage.getItem("authToken")) {
        $.ajax({
            url: apiConfig.apiUrl + "/users/me",
            type: "GET",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("authToken"),
            },
        })
            .done(function (response) {
                console.log(response);
                if (response.ruolo === "gestore" || response.ruolo === "Gestore") {
                    // Prima recupera l'ID del negozio del gestore
                    $.ajax({
                        url: apiConfig.apiUrl + "/sedes/getSedeByUserId/" + response.id,
                        type: "GET",
                        contentType: "application/json"
                    })
                        .done(function (sedeData) {
                            // Quando abbiamo l'ID della sede creiamo il link corretto
                            $("#navbarNav").append(`
              <a class="nav-link btn" href="sede.html?id=${sedeData.id}">
                <i class="fas fa-archive me-1"></i>Gestisci la tua sede
              </a>
            `);
                        })
                        .fail(function (error) {
                            // Se il gestore non ha ancora una sede, offri l'opzione di crearne uno
                            console.error("Errore nel recupero delle sedi:", error);
                            $("#navbarNav").append(`
              <a class="nav-link btn" href="register.html?step=2">
                <i class="fas fa-plus-circle me-1"></i>Crea la tua sede
              </a>
            `);
                        });
                }
            })
            .fail(function (error) {
                console.error("Errore:", error);
            });
    }

    function renderSedi(servizi) {
        servizi.forEach((prod) => {
            $("#products").append(`
                        <div class="col-lg-4 col-md-6">
                            <div class="card h-100 shadow-sm prodotto-card">
                                <img src="${prod.immagine || "https://via.placeholder.com/400x250"}" class="card-img-top" 
                                    alt="${prod.nome}">
                                <div class="card-body">
                                    <h5 class="card-title">${prod.nome}</h5>
                                    <p class="card-text">€${prod.prezzo}</p>
                                    <button class="btn btn-sm btn-outline-primary mt-2">Aggiungi al carrello</button>
                                </div>
                            </div>
                        </div>
                    `);
        });
    }

    // Navbar scroll effect
    $(window).scroll(function () {
        if ($(window).scrollTop() > 50) {
            $(".navbar").addClass("shadow-lg");
        } else {
            $(".navbar").removeClass("shadow-lg");
        }
    });
});
