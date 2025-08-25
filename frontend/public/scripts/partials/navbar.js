// frontend/public/scripts/navbar.js
$(function () {
    const apiUrl = apiConfig.apiUrl;
    const token = localStorage.getItem("authToken");
    const isLogged = !!token;

    // Recupera dati utente dal localStorage
    let userData = null;
    if (isLogged) {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            try {
                userData = JSON.parse(storedUser);
            } catch (e) {
                console.error("Errore parsing userData:", e);
            }
        }
    }
    const role = userData?.ruolo?.toLowerCase() || null;

    // Carica la partial navbar e poi esegue il setup
    $("#navbar-placeholder").load("./partials/navbar.html", function () {
        // Cache selettori
        const $profileLink = $("#profile-link");
        const $accediLink = $("#accedi-link");
        const $logoutLink = $("#logout-link");
        const $adminPanelLink = $("#admin-panel-link");

        // Toggle base
        $accediLink.toggleClass("d-none", isLogged);
        $profileLink.toggleClass("d-none", !isLogged);
        $logoutLink.toggleClass("d-none", !isLogged);

        // Saluto accanto a Profilo
        if (isLogged && $profileLink.find(".hello-chip").length === 0) {
            const name = userData?.nome || "";
            $profileLink.find("a").prepend(
                `<small class="me-1 hello-chip">Ciao ${name ? name : ""}!</small>`
            );
        }

        // Azioni GESTORE
        if (isLogged && role === "gestore") {
            // se vuoi puoi aggiungere link gestore qui
            console.log("Navbar → modalità GESTORE attiva");
        }

        // Azioni ADMIN → mostra link pannello
        if (isLogged && role === "admin") {
            $adminPanelLink.removeClass("d-none");
        }
    });

    // Ricerca (delegata)
    $(document)
        .off("submit", "#navbar-search-form")
        .on("submit", "#navbar-search-form", function (e) {
            e.preventDefault();
            const query = $(this).find('input[name="q"]').val().trim();
            if (query) window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        });

    // Logout (delegato)
    $(document).on("click", "#logout-link a", function (e) {
        e.preventDefault();
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "login.html";
    });
});