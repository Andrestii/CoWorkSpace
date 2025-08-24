// frontend/public/scripts/pages/carrello.js
$(function () {
  const API_SPAZI = `${apiConfig.apiUrl}/spazi`;
  const API_SEDI  = `${apiConfig.apiUrl}/sedi`;
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
    // Se vuoi consentire anche utenti non loggati, rimuovi questo blocco
    location.href = "login.html";
    return;
  }

  // ---- Helpers ----
  const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));

  const capTipologia = (t) => {
    if (!t) return "-";
    return String(t).replace(/_/g," ")
      .split(" ").map(w => w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())
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
    $("#spazioPrezzo").text(spazio.prezzo_orario != null ? `${Number(spazio.prezzo_orario).toFixed(2)} € / h` : "-");

    // Carico sede se presente
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
        $loading.hide(); $cartBody.removeClass("d-none");
      }).fail(() => {
        $("#sedeNomeRow").text("");
        $("#sedeAddrRow").text("");
        $loading.hide(); $cartBody.removeClass("d-none");
      });
    } else {
      $("#sedeNomeRow").text("");
      $("#sedeAddrRow").text("");
      $loading.hide(); $cartBody.removeClass("d-none");
    }

    // --- Form handlers ---
    const $data = $("#dataPren");
    const $start = $("#oraInizio");
    const $end = $("#oraFine");
    const $err = $("#formError");
    const $btn = $("#btnConferma");
    const $durata = $("#durataTxt");
    const $tot = $("#totaleTxt");

    // min data = oggi
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth()+1).padStart(2,"0");
    const dd = String(today.getDate()).padStart(2,"0");
    $data.attr("min", `${yyyy}-${mm}-${dd}`);

    function validateAndUpdate() {
      $err.addClass("d-none").text("");

      const d = $data.val();
      const t1 = $start.val();
      const t2 = $end.val();

      if (!d || !t1 || !t2) {
        $btn.prop("disabled", true);
        $durata.text("-");
        $tot.text("-");
        return false;
      }

      const m1 = hhmmToMinutes(t1);
      const m2 = hhmmToMinutes(t2);
      if (m1 == null || m2 == null || m2 <= m1) {
        $err.removeClass("d-none").text("L'orario di fine deve essere successivo a quello di inizio.");
        $btn.prop("disabled", true);
        $durata.text("-");
        $tot.text("-");
        return false;
      }

      const mins = m2 - m1;
      $durata.text(minutesToHoursText(mins));

      // totale
      let totale = "-";
      if (spazio.prezzo_orario != null) {
        const ore = mins / 60;
        totale = `${(Number(spazio.prezzo_orario) * ore).toFixed(2)} €`;
      }
      $tot.text(totale);

      $btn.prop("disabled", false);
      return true;
    }

    $data.on("change", validateAndUpdate);
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
          data: $("#dataPren").val(),           // YYYY-MM-DD
          ora_inizio: $("#oraInizio").val(),    // HH:MM
          ora_fine: $("#oraFine").val(),        // HH:MM
        }
      };

      // opzionale: calcolo server-side in futuro; qui salvo anche il totale stimato
      const mins = hhmmToMinutes(payload.prenotazione.ora_fine) - hhmmToMinutes(payload.prenotazione.ora_inizio);
      const ore = mins / 60;
      if (spazio.prezzo_orario != null) {
        payload.prenotazione.totale_stimato = Number(spazio.prezzo_orario) * ore;
      }

      try {
        localStorage.setItem("checkout", JSON.stringify(payload));
      } catch (e) {
        console.warn("Impossibile salvare il checkout nel localStorage", e);
      }

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
