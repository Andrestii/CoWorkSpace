// scripts/pages/editSpazi.js
$(async function () {
    const token = localStorage.getItem("authToken");
    if (!token) { window.location.href = "login.html"; return; }

    const API_ROOT = apiConfig.apiUrl;
    const API_SPAZI = `${API_ROOT}/spazi`;

    const $form = $("#form-edit-spazio");
    const $list = $("#mie-spazi-list");

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
    toggleForm(false);

    function normalizeSpazio(s) {
        if (!s) return null;
        return {
            id: Number(s.id),
            id_sede: Number(s.id_sede),
            nome: s.nome || "",
            descrizione: s.descrizione || "",
            tipologia: s.tipologia || "",
            capienza: s.capienza ?? "",
            prezzo_orario: s.prezzo_orario ?? "",
            attivo: !!s.attivo,
            immagine: s.immagine || null,
        };
    }

    function fillForm(sp) {
        if (!sp) return;
        $("#id_spazio").val(sp.id);
        $("#nome").val(sp.nome);
        $("#descrizione").val(sp.descrizione);
        $("#tipologia").val(sp.tipologia);
        $("#capienza").val(sp.capienza);
        $("#prezzo_orario").val(sp.prezzo_orario);
        $("#attivo").prop("checked", sp.attivo);
    }

    async function loadMieiSpazi() {
        const res = await $.ajax({
            url: `${API_SPAZI}/getSpazi`,
            method: "GET",
            headers: { Authorization: "Bearer " + token }
        });
        const arr = Array.isArray(res) ? res : res?.data || [];
        const spazi = arr.map(normalizeSpazio).filter(x => x && x.id);

        $list.empty();
        spazi.forEach(s => {
            $list.append(`
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <h6 class="card-title">${s.nome}</h6>
              <p class="card-text small mb-3">
                ${s.tipologia || "—"}${s.capienza ? ` — ${s.capienza} posti` : ""}
              </p>
              <button class="btn btn-sm btn-outline-primary mt-auto btn-seleziona" data-id="${s.id}">
                <i class="fa fa-pen"></i> Modifica
              </button>
            </div>
          </div>
        </div>
      `);
        });

        return spazi;
    }

    let mieiSpazi = [];
    try {
        mieiSpazi = await loadMieiSpazi();
    } catch (e) {
        toastErr("Errore nel caricamento spazi");
    }

    $list.on("click", ".btn-seleziona", function () {
        const id = $(this).data("id");
        const spazio = mieiSpazi.find(s => s.id === id);
        if (spazio) {
            fillForm(spazio);
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
        const id = $("#id_spazio").val();
        if (!id) return;

        const fd = new FormData($form[0]);

        // rimuovi l'id dal body: l'ID è già nell'URL
        fd.delete("id");

        // rimuovi stringhe vuote per non sovrascrivere con valori vuoti
        for (const [k, v] of Array.from(fd.entries())) {
            if (typeof v === "string" && v.trim() === "") fd.delete(k);
        }

        const img = $("#immagine")[0]?.files?.[0];
        if (img) fd.set("immagine", img);

        // flag attivo
        fd.set("attivo", $("#attivo").is(":checked") ? 1 : 0);

        toggleForm(false);
        try {
            await $.ajax({
                url: `${API_SPAZI}/updateSpazio/${id}`,
                type: "PUT",
                data: fd,
                processData: false,
                contentType: false,
                headers: { Authorization: "Bearer " + token }
            });
            toastOk("Spazio aggiornato");
            mieiSpazi = await loadMieiSpazi();
        } catch (err) {
            toastErr(err?.responseJSON?.message || "Errore update");
        } finally {
            toggleForm(true);
        }
    });
});

