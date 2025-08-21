// frontend/public/scripts/navbar.js
$(function () {
    const apiUrl = "http://localhost:3000/api"; // base API
    const token = localStorage.getItem("authToken");
    const isLogged = !!token;

    // Carica la partial navbar e poi esegue il setup
    $("#navbar-placeholder").load("./partials/navbar.html", function () {
        // Cache selettori
        const $navbarNav = $("#navbarNav");
        const $addProductLink = $("#add-product-link");
        const $searchForm = $("#navbar-search-form");
        const $profileLink = $("#profile-link");
        const $cartLink = $("#cart-link");
        const $accediLink = $("#accedi-link");
        const $adminPanelLink = $("#admin-panel-link");

        // Toggle base
        $accediLink.toggleClass("d-none", isLogged);
        $profileLink.toggleClass("d-none", !isLogged);
        $cartLink.toggleClass("d-none", !isLogged);

        // Recupera dati utente dal localStorage (se presenti)
        let userData = null;
        if (isLogged) {
            const storedUser = localStorage.getItem("userData");
            if (storedUser) userData = JSON.parse(storedUser);
        }
        const role = userData?.ruolo || null;

        // Saluto
        if (isLogged && $profileLink.find(".hello-chip").length === 0) {
            $profileLink.find("a").prepend(`<small class="me-1 hello-chip">Ciao!</small>`);
        }

        // Azioni GESTORE
        if (isLogged && role === "gestore" && userData?.id) {
            $searchForm.addClass("d-none"); // nasconde ricerca per gestori

            $.ajax({
                url: `${apiUrl}/sedes/getSedeByUserId/${userData.id}`,
                type: "GET",
                contentType: "application/json",
            })
            .done(function (sedeData) {
                $("#add-product-anchor").attr("href", `add-product.html?sedeId=${sedeData.id}`);
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

            $addProductLink.toggleClass("d-none", false); // mostra Aggiungi Prodotto
        }

        // Azioni ADMIN
        if (role === "admin") {
            $cartLink.addClass("d-none");
            $addProductLink.addClass("d-none");
            $searchForm.addClass("d-none");
            $navbarNav.children(".nav-item").not("#admin-panel-link, #profile-link, #cart-link, #add-product-link, #accedi-link")
                      .addClass("d-none");
            $adminPanelLink.removeClass("d-none");
        }
    });

    // Ricerca (delegata)
    $(document).off("submit", "#navbar-search-form")
               .on("submit", "#navbar-search-form", function (e) {
        e.preventDefault();
        const query = $(this).find('input[name="q"]').val().trim();
        if (query) window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    });

    // Logout
    $(document).on("click", "#logout-link", function () {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "login.html";
    });
});
