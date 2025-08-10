// frontend/public/scripts/navbar.js
$(function () {
    // carica la partial e SOLO dopo lavora sugli elementi
    $("#navbar-placeholder").load("./partials/navbar.html", function () {
        const token = localStorage.getItem("authToken");
        const isLogged = !!token;

        // evita errori se Auth non è definito o se non loggato
        const userData = (isLogged && typeof Auth?.getUserData === "function")
            ? (Auth.getUserData() || null)
            : null;
        const role = userData?.ruolo || null;

        // cache selettori
        const $navbarNav = $("#navbarNav");
        const $addProductLink = $("#add-product-link");
        const $searchForm = $("#navbar-search-form");
        const $profileLink = $("#profile-link");
        const $cartLink = $("#cart-link");
        const $accediLink = $("#accedi-link");
        const $adminPanelLink = $("#admin-panel-link");

        // toggle base (evita flicker: la partial tiene d-none di default)
        $accediLink.toggleClass("d-none", isLogged);
        $profileLink.toggleClass("d-none", !isLogged);
        $cartLink.toggleClass("d-none", !isLogged);

        // link gestore (Aggiungi Prodotto)
        $addProductLink.toggleClass("d-none", !(isLogged && role === "gestore"));

        // saluto
        if (isLogged && $profileLink.find(".hello-chip").length === 0) {
            $profileLink.find("a").prepend(`<small class="me-1 hello-chip">Ciao!</small>`);
        }

        // azioni specifiche GESTORE
        if (isLogged && role === "gestore" && userData?.id) {
            $.ajax({
                url: `${apiConfig.apiUrl}/sedes/getSedeByUserId/${userData.id}`,
                type: "GET",
                contentType: "application/json",
            })
                .done(function (sedeData) {
                    // setta href del bottone "Aggiungi Prodotto"
                    $("#add-product-anchor").attr("href", `add-product.html?sedeId=${sedeData.id}`);

                    // aggiungi link "Gestisci la tua sede" se non già presente
                    if (!$("#manage-sede-link").length) {
                        $navbarNav.append(`
            <a id="manage-sede-link" class="nav-link btn" href="sede.html?id=${sedeData.id}">
              <i class="fas fa-archive me-1"></i>Gestisci la tua sede
            </a>
          `);
                    }
                })
                .fail(function () {
                    if (!$("#create-sede-link").length) {
                        $navbarNav.append(`
            <a id="create-sede-link" class="nav-link btn" href="register.html?step=2">
              <i class="fas fa-plus-circle me-1"></i>Crea la tua sede
            </a>
          `);
                    }
                });

            // opzionale: nascondi la search per i gestori
            $searchForm.addClass("d-none");
        }

        // azioni specifiche ADMIN
        if (role === "admin") {
            // nascondi elementi non necessari
            $cartLink.addClass("d-none");
            $addProductLink.addClass("d-none");
            $searchForm.addClass("d-none");

            // nascondi voci generiche (Home/Sedi/Servizi)
            const $generalNavItems = $("#navbarNav .navbar-nav > .nav-item")
                .not("#admin-panel-link, #profile-link, #cart-link, #add-product-link, #accedi-link");
            $generalNavItems.addClass("d-none");

            // mostra pannello admin
            if ($adminPanelLink.length) $adminPanelLink.removeClass("d-none");
        }
    });

    // ricerca (delegata: funziona anche dopo il .load)
    $(document)
        .off("submit", "#navbar-search-form")
        .on("submit", "#navbar-search-form", function (e) {
            e.preventDefault();
            const query = $(this).find('input[name="q"]').val().trim();
            if (!query) return;
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        });
});
