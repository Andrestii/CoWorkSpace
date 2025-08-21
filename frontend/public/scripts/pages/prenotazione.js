$(document).ready(function () {
    // Inizializza il calendario (solo date)
    flatpickr(".calendario", {
        altInput: true,
        altFormat: "l d F Y",
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: "it"
    });

    // Inizializza i timepicker (solo orari con step di 30 min)
    flatpickr(".timepicker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        locale: "it"
    });

    let step = 1; // controllo step bottone

    $("#bookingForm").on("submit", function (e) {
        e.preventDefault();

        const sede = $("#sede").val();
        const data = $("#data").val();
        const orarioInizio = $("#orarioInizio").val();
        const orarioFine = $("#orarioFine").val();

        if (!sede || !data || !orarioInizio || !orarioFine) {
            alert("Compila tutti i campi!");
            return;
        }

        if (orarioFine <= orarioInizio) {
            alert("L'orario di fine deve essere successivo all'orario di inizio!");
            return;
        }

        // Prezzo fittizio
        let prezzo = 20;
        if (sede.includes("Milano")) prezzo += 10;

        // Popola riepilogo
        $("#riepilogoSede").text(sede);
        $("#riepilogoData").text(data);
        $("#riepilogoOrario").text(`${orarioInizio} - ${orarioFine}`);
        $("#riepilogoPrezzo").text(prezzo);

        if (step === 1) {
            // Step 1 → mostra riepilogo
            $("#riepilogo").slideDown();
            $("html, body").animate({ scrollTop: $("#riepilogo").offset().top - 80 }, 800);

            // cambia testo del bottone
            $("#bookingForm button[type='submit']").text("Conferma e paga");
            step = 2;
        } else {
            // Step 2 → mostra pagamento
            $("#paymentSection").slideDown();
            $("html, body").animate({ scrollTop: $("#paymentSection").offset().top - 80 }, 800);
            step = 3; // blocca oltre
        }
    });

    // Gestione pagamento
    $("#paymentForm").on("submit", function (e) {
        e.preventDefault();

        // Popola il modal con i dati riepilogo
        $("#modalSede").text($("#riepilogoSede").text());
        $("#modalData").text($("#riepilogoData").text());
        $("#modalOrario").text($("#riepilogoOrario").text());
        $("#modalPrezzo").text($("#riepilogoPrezzo").text());

        // Mostra il modal
        const modal = new bootstrap.Modal(document.getElementById("confermaModal"));
        modal.show();
    });
});
