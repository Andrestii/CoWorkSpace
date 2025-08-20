$(document).ready(function () {
    // Inizializza il calendario
    flatpickr(".calendario", {
        altInput: true,
        altFormat: "l d F Y",
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: "it"
    });

    // Gestione form prenotazione
    $("#bookingForm").on("submit", function (e) {
        e.preventDefault();

        const sede = $("#sede").val();
        const data = $("#data").val();
        const orario = $("input[name='orario']:checked").val();

        if (!sede || !data || !orario) {
            alert("Compila tutti i campi!");
            return;
        }

        // Calcola prezzo fittizio
        let prezzo = 20;
        if (orario.includes("09:00") || orario.includes("14:00")) prezzo = 25;
        if (sede.includes("Milano")) prezzo += 10;

        $("#riepilogoSede").text(sede);
        $("#riepilogoData").text(data);
        $("#riepilogoOrario").text(orario);
        $("#riepilogoPrezzo").text(prezzo);

        $("#riepilogo").slideDown();
        $("html, body").animate({ scrollTop: $("#riepilogo").offset().top - 100 }, 800);

        setTimeout(() => {
            $("#paymentSection").fadeIn();
            $("html, body").animate({ scrollTop: $("#paymentSection").offset().top - 80 }, 1000);
        }, 1000);
    });

    // Gestione pagamento
    $("#paymentForm").on("submit", function (e) {
        e.preventDefault();
        alert("Pagamento completato con successo! 🎉");
        window.location.href = "index.html";
    });
});
