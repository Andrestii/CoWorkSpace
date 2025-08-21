$(document).ready(function () {
    const params = new URLSearchParams(window.location.search);
    const sedeId = params.get("id");

    if (!sedeId) {
        $("#loading").hide();
        $("#errore").removeClass("d-none").text("Nessuna sede selezionata.");
        return;
    }

    const apiUrl = `http://localhost:3000/sedi/getAllSedi/${sedeId}`; // backend route

    fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error("Errore API");
            return res.json();
        })
        .then(sede => {
            $("#loading").hide();

            $("#sedeNome").text(sede.nome);

            $("#dettaglioSede").html(`
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <img src="${sede.immagine || 'assets/default-sede.jpg'}" class="img-fluid rounded shadow" alt="${sede.nome}">
                    </div>
                    <div class="col-lg-6">
                        <h2>${sede.nome}</h2>
                        <p class="text-muted"><i class="fas fa-map-marker-alt me-2"></i>${sede.indirizzo}</p>
                        <p><span class="badge bg-warning text-dark">${sede.tipo || "Coworking"}</span></p>
                        <p class="fw-bold text-primary">€${sede.prezzo || 0} / ora</p>
                        <p>${sede.descrizione || "Questa sede offre spazi moderni e flessibili per il tuo lavoro."}</p>
                        <a href="prenotazione.html?sede=${sede.id}" class="btn btn-primary btn-lg mt-3">
                            <i class="fas fa-calendar-check me-2"></i> Prenota ora
                        </a>
                        <a href="sedi.html" class="btn btn-outline-secondary btn-lg mt-3 ms-2">
                            <i class="fas fa-arrow-left me-2"></i> Torna alle sedi
                        </a>
                    </div>
                </div>
            `);
        })
        .catch(err => {
            console.error("Errore:", err);
            $("#loading").hide();
            $("#errore").removeClass("d-none");
        });
});
