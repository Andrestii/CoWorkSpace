$(async function () {
  const token = localStorage.getItem("authToken");
  if (!token) { window.location.href = "login.html"; return; }

  const API_ROOT = apiConfig.apiUrl;
  const API_SPAZI = `${API_ROOT}/spazi`;
  const API_SERVIZI = `${API_ROOT}/servizi`;

  const $selectSpazio = $("#select-spazio");
  const $btnSalva = $("#btn-salva");
  const $btnReload = $("#btn-reload");
  const $wrapServizi = $("#wrap-servizi");
  const $placeholder = $("#placeholder");
  const $checkAll = $("#check-all");
  const $uncheckAll = $("#uncheck-all");

  let TUTTI_SERVIZI = [];
  let TUTTI_SPAZI = [];
  let SPAZIO_SEL = null;
  let SERVIZI_SEL_SET = new Set();

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

  function enableControls(enabled) {
    $selectSpazio.prop("disabled", !enabled);
    $btnSalva.prop("disabled", !enabled || !SPAZIO_SEL);
    $checkAll.prop("disabled", !enabled || !SPAZIO_SEL);
    $uncheckAll.prop("disabled", !enabled || !SPAZIO_SEL);
    $btnReload.prop("disabled", !enabled);
    $wrapServizi.find("input[type=checkbox]").prop("disabled", !enabled || !SPAZIO_SEL);
  }

  function normalizeSpazio(s) {
    const serviziIds = [];
    if (Array.isArray(s?.spazi_servizi)) {
      s.spazi_servizi.forEach(r => {
        const sid = r?.id_servizio ?? r?.servizi?.id;
        if (sid) serviziIds.push(Number(sid));
      });
    }
    return {
      id: Number(s.id),
      nome: s.nome || "",
      serviziIds
    };
  }

  async function loadSpazi() {
    const res = await $.ajax({
      url: `${API_SPAZI}/getSpazi`,
      method: "GET",
      headers: { Authorization: "Bearer " + token }
    });
    const arr = Array.isArray(res) ? res : (res?.data || []);
    TUTTI_SPAZI = arr.map(normalizeSpazio).filter(x => x && x.id);
    // riempi select
    $selectSpazio.empty().append('<option value="">— Seleziona uno spazio —</option>');
    TUTTI_SPAZI.forEach(sp => {
      $selectSpazio.append(`<option value="${sp.id}">${sp.nome}</option>`);
    });
    $selectSpazio.prop("disabled", false);
  }

  async function loadServizi() {
    const res = await $.ajax({ url: `${API_SERVIZI}/getServizi`, method: "GET" });
    TUTTI_SERVIZI = Array.isArray(res) ? res : (res?.data || []);
  }

  function renderListaServizi() {
    $wrapServizi.empty();
    if (!TUTTI_SERVIZI.length) {
      $wrapServizi.append(`<div class="col-12 text-center text-muted">Nessun servizio disponibile.</div>`);
      return;
    }

    TUTTI_SERVIZI.forEach(srv => {
      const checked = SERVIZI_SEL_SET.has(Number(srv.id)) ? "checked" : "";
      $wrapServizi.append(`
        <div class="col-12 col-md-6 col-lg-4">
          <div class="border rounded p-3 d-flex justify-content-between align-items-center">
            <span class="fw-semibold">${formatNomeServizio(srv.nome)}</span>
            <div class="form-check form-switch m-0">
              <input class="form-check-input srv-toggle" type="checkbox" data-id="${srv.id}" ${checked}>
            </div>
          </div>
        </div>
      `);
    });
  }

  function applySpazioSelection(spazioId) {
    SPAZIO_SEL = TUTTI_SPAZI.find(s => s.id === Number(spazioId)) || null;
    SERVIZI_SEL_SET = new Set(SPAZIO_SEL ? SPAZIO_SEL.serviziIds : []);
    renderListaServizi();
    enableControls(true);
  }

  function formatNomeServizio(raw) {
  if (!raw) return "";
  let cleaned = raw.replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}


  $selectSpazio.on("change", function () {
    const id = $(this).val();
    if (!id) {
      SPAZIO_SEL = null;
      SERVIZI_SEL_SET = new Set();
      renderListaServizi();
      enableControls(true);
      return;
    }
    applySpazioSelection(id);
  });

  $wrapServizi.on("change", ".srv-toggle", function () {
    const sid = Number($(this).data("id"));
    if ($(this).is(":checked")) SERVIZI_SEL_SET.add(sid);
    else SERVIZI_SEL_SET.delete(sid);
  });

  $checkAll.on("click", function (e) {
    e.preventDefault();
    TUTTI_SERVIZI.forEach(s => SERVIZI_SEL_SET.add(Number(s.id)));
    renderListaServizi();
  });

  $uncheckAll.on("click", function (e) {
    e.preventDefault();
    SERVIZI_SEL_SET.clear();
    renderListaServizi();
  });

  $btnReload.on("click", async function () {
    try {
      enableControls(false);
      $placeholder.show();
      await Promise.all([loadServizi(), loadSpazi()]);
      $placeholder.hide();
      // Conserva eventuale selezione precedente
      const prev = SPAZIO_SEL?.id;
      if (prev && TUTTI_SPAZI.some(s => s.id === prev)) {
        $selectSpazio.val(prev);
        applySpazioSelection(prev);
      } else {
        SPAZIO_SEL = null; SERVIZI_SEL_SET = new Set(); renderListaServizi();
      }
      toastOk("Dati ricaricati");
    } catch (e) {
      toastErr("Errore nel ricaricare i dati");
      enableControls(true);
    }
  });

  $btnSalva.on("click", async function () {
    if (!SPAZIO_SEL) return;
    try {
      enableControls(false);
      const body = { servizi: Array.from(SERVIZI_SEL_SET) };
      await $.ajax({
        url: `${API_SPAZI}/setServizi/${SPAZIO_SEL.id}/servizi`,
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        data: JSON.stringify(body)
      });
      toastOk("Servizi aggiornati");
      SPAZIO_SEL.serviziIds = [...SERVIZI_SEL_SET];
    } catch (e) {
      const msg = e?.responseJSON?.error || e?.responseJSON?.message || "Errore nel salvataggio";
      toastErr(msg);
    } finally {
      enableControls(true);
    }
  });

  try {
    enableControls(false);
    await Promise.all([loadServizi(), loadSpazi()]);
    $placeholder.hide();
    renderListaServizi();
    enableControls(true);
  } catch (e) {
    toastErr("Errore iniziale di caricamento");
    enableControls(true);
  }
});
