// frontend/public/scripts/pages/carrello.js
$(function () {
  const API_SPAZI = `${apiConfig.apiUrl}/spazi`;
  const API_SEDI = `${apiConfig.apiUrl}/sedi`;
  const API_DISP = `${apiConfig.apiUrl}/disponibilita`;
  const token = localStorage.getItem("authToken");

  const qs = new URLSearchParams(location.search);
  const spazioId = Number(qs.get("spazio"));

  const $loading = $("#loading");
  const $errore = $("#errore");
  const $cartBody = $("#cartBody");

  if (!spazioId) {
    showError("Parametro mancante: spazio");
    return;
  }
  if (!token) {
    location.href = "login.html";
    return;
  }

  // ---- Helpers ----
  const escapeHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));

  function formatDateIt(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
  }

  const capTipologia = (t) => {
    if (!t) return "-";
    return String(t)
      .replace(/_/g, " ")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  function showError(msg) {
    $loading.hide();
    $errore.removeClass("d-none").text(msg || "Errore inatteso.");
  }

  function hhmmToMinutes(hhmm) {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
  function minutesToHoursText(mins) {
    if (mins == null || mins < 0) return "-";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }
  const toYMD = (d) => d.toISOString().slice(0, 10);

  // ---- Carico spazio e sede ----
  $.ajax({
    url: `${API_SPAZI}/getSpazi`,
    headers: { Authorization: "Bearer " + token }
  }).done(function (spazi) {
    const spazio = (Array.isArray(spazi) ? spazi : []).find(s => Number(s.id) === spazioId);
    if (!spazio) return showError("Spazio non trovato.");

    // Riempio base UI
    $("#spazioNome").text(spazio.nome || "Spazio");
    $("#spazioDescr").text(spazio.descrizione || "");
    $("#spazioImg").attr("src", spazio.immagine || "https://via.placeholder.com/1200x600?text=Spazio");
    $("#spazioTipologia").text(capTipologia(spazio.tipologia));
    $("#spazioCapienza").text(Number.isFinite(spazio.capienza) ? `${spazio.capienza} posti` : "-");
    $("#spazioPrezzo").text(
      spazio.prezzo_orario != null ? `${Number(spazio.prezzo_orario).toFixed(2)} € / h` : "-"
    );

    // Carico sede se presente
    const afterSede = () => { $loading.hide(); $cartBody.removeClass("d-none"); };
    if (spazio.id_sede) {
      $.ajax({
        url: `${API_SEDI}/getAllSedi/${spazio.id_sede}`,
        headers: { Authorization: "Bearer " + token }
      }).done(function (sede) {
        $("#sedeNomeRow").html(
          `<i class="fa-solid fa-building me-2"></i><a href="sede.html?id=${sede.id}">${escapeHtml(sede.nome || "Sede")}</a>`
        );
        $("#sedeAddrRow").html(
          `<i class="fa-solid fa-location-dot me-2"></i>${escapeHtml(sede.indirizzo || "")}${sede.citta ? ", " + escapeHtml(sede.citta) : ""}`
        );
        afterSede();
      }).fail(() => {
        $("#sedeNomeRow, #sedeAddrRow").text("");
        afterSede();
      });
    } else {
      $("#sedeNomeRow, #sedeAddrRow").text("");
      afterSede();
    }

    // --- Form handlers + disponibilità ---
    const $data = $("#dataPren");
    const $start = $("#oraInizio");
    const $end = $("#oraFine");
    const $err = $("#formError");
    const $btn = $("#btnConferma");
    const $durata = $("#durataTxt");
    const $tot = $("#totaleTxt");

    let giorniDisponibili = [];

    $.ajax({
      url: `${API_DISP}/list?id_spazio=${encodeURIComponent(spazio.id)}`,
      type: "GET",
      headers: { Authorization: "Bearer " + token }
    }).done(function (slots) {
      giorniDisponibili = (slots || [])
        .filter(s => s.disponibile)
        .map(s => s.start_at.slice(0, 10))
        .sort(); // ordina YYYY-MM-DD

      // crea/aggiorna un hint sotto al campo data
      if (!$("#dateHelp").length) {
        $('<div id="dateHelp" class="form-hint mt-1"></div>').insertAfter($("#dataPren"));
      }

      // mostra le prossime 5 date prenotabili
      const todayStr = toYMD(new Date());
      const prossime = giorniDisponibili.filter(d => d >= todayStr).slice(0, 5);
      if (prossime.length) {
        $("#dateHelp").text("Prossime date disponibili: " + prossime.map(d => formatDateIt(d)).join(" • "));
      } else {
        $("#dateHelp").text("Nessuna disponibilità futura.");
      }

      // ✨ auto-seleziona la prima data >= oggi e precompila 08–17
      const next = giorniDisponibili.find(d => d >= todayStr);
      if (next) {
        $("#dataPren").val(next).trigger("change"); // questo farà scattare la precompilazione orari
      }
    });

    // min data = oggi
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    $data.attr("min", `${yyyy}-${mm}-${dd}`);

    function validateAndUpdate() {
      $err.addClass("d-none").text("");
      $btn.prop("disabled", true);
      $durata.text("-"); $tot.text("-");

      const d = $data.val();
      const t1 = $start.val();
      const t2 = $end.val();

      if (!d) return false;

      // controlla che la data sia disponibile
      if (!giorniDisponibili.includes(d)) {
        $err.removeClass("d-none").text("Nessuna disponibilità per questa data.");
        return false;
      }

      if (!t1 || !t2) return false;

      const m1 = hhmmToMinutes(t1);
      const m2 = hhmmToMinutes(t2);
      if (m1 == null || m2 == null || m2 <= m1) {
        $err.removeClass("d-none").text("L'orario di fine deve essere successivo a quello di inizio.");
        return false;
      }

      const mins = m2 - m1;
      $durata.text(minutesToHoursText(mins));
      if (spazio.prezzo_orario != null) {
        const ore = mins / 60;
        $tot.text(`${(Number(spazio.prezzo_orario) * ore).toFixed(2)} €`);
      } else {
        $tot.text("-");
      }

      $btn.prop("disabled", false);
      return true;
    }

    $data.on("change", function () {
      const d = $(this).val();
      if (!d) return;

      if (!giorniDisponibili.includes(d)) {
        $err.removeClass("d-none").text("Nessuna disponibilità per questa data.");
        $btn.prop("disabled", true);
        $start.val(""); $end.val("");
        return;
      }

      // precompila 08:00–17:00 per la nuova logica
      $start.val("08:00");
      $end.val("17:00");
      validateAndUpdate();
    });

    $start.on("change", validateAndUpdate);
    $end.on("change", validateAndUpdate);

    // Conferma → salva in localStorage e vai a pagamento.html
    $btn.on("click", function () {
      if (!validateAndUpdate()) return;

      const payload = {
        spazio: {
          id: spazio.id,
          nome: spazio.nome,
          tipologia: spazio.tipologia,
          capienza: spazio.capienza,
          prezzo_orario: spazio.prezzo_orario,
          id_sede: spazio.id_sede,
          immagine: spazio.immagine || null
        },
        prenotazione: {
          data: $("#dataPren").val(),        // YYYY-MM-DD
          ora_inizio: $("#oraInizio").val(), // HH:MM
          ora_fine: $("#oraFine").val()      // HH:MM
        }
      };

      const mins = hhmmToMinutes(payload.prenotazione.ora_fine) - hhmmToMinutes(payload.prenotazione.ora_inizio);
      const ore = mins / 60;
      if (spazio.prezzo_orario != null) {
        payload.prenotazione.totale_stimato = Number(spazio.prezzo_orario) * ore;
      }

      try { localStorage.setItem("checkout", JSON.stringify(payload)); } catch { }
      location.href = `pagamento.html?spazio=${encodeURIComponent(spazio.id)}`;
    });

  }).fail(function (xhr) {
    let msg = "Errore nel caricamento dei dati dello spazio.";
    if (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) {
      msg = xhr.responseJSON.error || xhr.responseJSON.message;
    }
    showError(msg);
  });
});
