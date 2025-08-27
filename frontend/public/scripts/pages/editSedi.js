
$(async function () {
    const token = localStorage.getItem("authToken");
    if (!token) { window.location.href = "login.html"; return; }

    const API_ROOT = apiConfig.apiUrl;
    const API_SEDI = `${API_ROOT}/sedi`;

    const $form = $("#form-edit-sede");
    const $list = $("#mie-sedi-list");

    toggleForm(false);

    function toastOk(msg) {
        $("#global-toast").removeClass("text-bg-danger").addClass("text-bg-success");
        $("#global-toast-body").text(msg || "Operazione completata");
        bootstrap.Toast.getOrCreateInstance(document.getElementById("global-toast"), { delay: 2000 }).show();
    }
    function toastErr(msg) {
        $("#global-toast").removeClass("text-bg-success").addClass("text-bg-danger");
        $("#global-toast-body").text(msg || "Errore");
        bootstrap.Toast.getOrCreateInstance(document.getElementById("global-toast"), { delay: 3000 }).show();
    }

    function toggleForm(enabled) {
        $form.find("input, textarea, button, select").prop("disabled", !enabled);
        $form.find('a.btn.btn-outline-secondary').prop("disabled", false);
    }

    function normalizeSede(s) {
        if (!s) return null;
        return {
            id: Number(s.id ?? s.id_sede ?? s.ID ?? s.IDSede),
            nome: s.nome ?? s.Nome ?? "",
            descrizione: s.descrizione ?? s.Descrizione ?? "",
            indirizzo: s.indirizzo ?? s.Indirizzo ?? "",
            citta: s.citta ?? s.Citta ?? "",
            provincia: String(s.provincia ?? s.Provincia ?? "").toUpperCase().slice(0, 2),
            cap: s.cap ?? s.CAP ?? "",
            regione: s.regione ?? s.Regione ?? "",
            latitudine: s.latitudine ?? s.Latitudine ?? "",
            longitudine: s.longitudine ?? s.Longitudine ?? "",
            attiva: Boolean(s.attiva ?? s.Attiva ?? s.attivo),
        };
    }

    function fillForm(s) {
        if (!s) return;
        $("#id_sede").val(s.id);
        $("#nome").val(s.nome);
        $("#descrizione").val(s.descrizione);
        $("#indirizzo").val(s.indirizzo);
        $("#citta").val(s.citta);
        $("#provincia").val(s.provincia);
        $("#cap").val(s.cap);
        $("#regione").val(s.regione);
        $("#latitudine").val(s.latitudine);
        $("#longitudine").val(s.longitudine);
        $("#attiva").prop("checked", s.attiva);
    }

    async function loadMieSedi() {
        const res = await $.ajax({
            url: `${API_SEDI}/mie`,
            method: "GET",
            headers: { Authorization: "Bearer " + token }
        });

        const arr = Array.isArray(res) ? res : res?.data || [];
        const sedi = arr.map(normalizeSede).filter(x => x && x.id);

        $list.empty();
        sedi.forEach(s => {
            $list.append(`
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <h6 class="card-title">${s.nome}</h6>
              <p class="card-text small mb-3">${s.indirizzo}, ${s.citta} (${s.provincia})</p>
              <button class="btn btn-sm btn-outline-primary mt-auto btn-seleziona" data-id="${s.id}">
                <i class="fa fa-pen"></i> Modifica
              </button>
            </div>
          </div>
        </div>
      `);
        });

        return sedi;
    }

    let mieSedi = [];
    try {
        mieSedi = await loadMieSedi();
    } catch (e) {
        toastErr("Errore nel caricamento sedi");
    }

    $list.on("click", ".btn-seleziona", function () {
        const id = $(this).data("id");
        const sede = mieSedi.find(s => s.id === id);
        if (sede) {
            fillForm(sede);
            toggleForm(true);
            window.scrollTo({ top: $form.offset().top - 100, behavior: "smooth" });
        }
    });

    $form.on("submit", async function (e) {
        e.preventDefault();
        if (!this.checkValidity()) {
            e.stopPropagation();
            $(this).addClass("was-validated");
            return;
        }
        const id = $("#id_sede").val();
        if (!id) return;

        const fd = new FormData($form[0]);
        const img = $("#immagine")[0]?.files?.[0];
        if (img) fd.set("immagine", img);
        fd.set("attiva", $("#attiva").is(":checked") ? 1 : 0);

        toggleForm(false);
        try {
            await $.ajax({
                url: `${API_SEDI}/updateSede/${id}`,
                type: "PUT",
                data: fd,
                processData: false,
                contentType: false,
                headers: { Authorization: "Bearer " + token }
            });
            toastOk("Sede aggiornata");
            mieSedi = await loadMieSedi();
        } catch (err) {
            toastErr(err?.responseJSON?.message || "Errore update");
        } finally {
            toggleForm(true);
        }
    });
});
