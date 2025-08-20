$(document).ready(function () {
    // Esempio sedi (puoi collegarlo a un'API reale)
    const sedi = [
        {
            id: 1,
            nome: "CoWorkSpace Milano – Porta Nuova",
            indirizzo: "Via della Moscova 12, Milano",
            immagine: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60",
            prezzo: 25,
            tipo: "Postazione singola"
        },
        {
            id: 2,
            nome: "CoWorkSpace Milano – Duomo Hub",
            indirizzo: "Corso Vittorio Emanuele II, Milano",
            immagine: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=60",
            prezzo: 40,
            tipo: "Sala riunioni"
        },
        {
            id: 3,
            nome: "CoWorkSpace Roma – Trastevere Hub",
            indirizzo: "Via dei Riari 25, Roma",
            immagine: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60",
            prezzo: 20,
            tipo: "Postazione singola"
        },
        {
            id: 4,
            nome: "CoWorkSpace Roma – Colosseo Business",
            indirizzo: "Via Cavour 180, Roma",
            immagine: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=60",
            prezzo: 60,
            tipo: "Ufficio privato"
        },
        {
            id: 5,
            nome: "CoWorkSpace Torino – San Salvario",
            indirizzo: "Corso Marconi 18, Torino",
            immagine: "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1200&q=60",
            prezzo: 18,
            tipo: "Postazione singola"
        },
        {
            id: 6,
            nome: "CoWorkSpace Torino – Lingotto Eventi",
            indirizzo: "Via Nizza 230, Torino",
            immagine: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=60",
            prezzo: 120,
            tipo: "Sala eventi"
        },
        {
            id: 7,
            nome: "CoWorkSpace Firenze – Centro Storico",
            indirizzo: "Piazza della Repubblica 5, Firenze",
            immagine: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=60",
            prezzo: 30,
            tipo: "Postazione singola"
        },
        {
            id: 8,
            nome: "CoWorkSpace Bologna – Fiera District",
            indirizzo: "Viale Aldo Moro 20, Bologna",
            immagine: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=60",
            prezzo: 80,
            tipo: "Ufficio privato"
        }
    ];

    sedi.forEach(sede => {
        $("#listaSedi").append(`
            <div class="col-lg-4 col-md-6">
                <div class="card h-100 shadow-sm prodotto-card">
                    <img src="${sede.immagine}" class="card-img-top" alt="${sede.nome}">
                    <div class="card-body">
                        <h5 class="card-title">${sede.nome}</h5>
                        <p class="card-text text-muted">${sede.indirizzo}</p>
                        <p class="fw-bold text-primary">€${sede.prezzo} / ora</p>
                        <span class="badge bg-warning text-dark">${sede.tipo}</span>
                        <div class="mt-3">
                            <a href="prenotazione.html?sede=${sede.id}" class="btn btn-primary">Prenota ora</a>
                        </div>
                    </div>
                </div>
            </div>
        `);
    });
});
