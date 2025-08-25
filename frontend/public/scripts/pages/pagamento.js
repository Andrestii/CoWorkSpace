$(function () {
  const token = localStorage.getItem("authToken");
  const $alertGlobal = $("#alertGlobal");
  const $alertForm = $("#alertForm");
  const $btn = $("#btnPaga");
  const $btnText = $btn.find(".btn-text");
  const $btnWait = $btn.find(".btn-wait");

  if (!token) {
    showGlobal("Devi accedere per completare il pagamento.", "warning");
    setTimeout(() => location.href = "login.html", 1200);
    return;
  }

  // === Recupero dati dal carrello ===
  let checkout = null;
  try { checkout = JSON.parse(localStorage.getItem("checkout")); } catch (e) { }
  if (!checkout || !checkout.spazio || !checkout.prenotazione) {
    showGlobal("Dati carrello non trovati. Torna al carrello.", "warning");
    return;
  }

  // Riepilogo
  $("#rSpazio").text(checkout.spazio.nome || "-");
  $("#rTipologia").text(prettyTipo(checkout.spazio.tipologia));
  $("#rData").text(checkout.prenotazione.data || "-");
  $("#rOrario").text((checkout.prenotazione.ora_inizio || "-") + " – " + (checkout.prenotazione.ora_fine || "-"));
  $("#rTotale").text(checkout.prenotazione.totale_stimato != null ? (Number(checkout.prenotazione.totale_stimato).toFixed(2) + " €") : "-");

  // Formattazioni fittizie dei campi carta (restano solo UI)
  $("#ccNumber").on("input", function () {
    let v = onlyDigits($(this).val());
    v = v.substring(0, 19);
    $(this).val(v.replace(/(.{4})/g, "$1 ").trim());
  });
  $("#ccExp").on("input", function () {
    let v = onlyDigits($(this).val()).substring(0, 4);
    if (v.length >= 3) v = v.substring(0, 2) + "/" + v.substring(2);
    $(this).val(v);
  });
  $("#ccCvv").on("input", function () {
    $(this).val(onlyDigits($(this).val()).substring(0, 4));
  });

  // === "Pagamento": crea la prenotazione già PAGATA e stop
  $("#payForm").on("submit", async function (e) {
    e.preventDefault();
    hideAlerts();

    // Validazioni minime (solo UX)
    if (
      !$("#ccName").val().trim() ||
      !$("#ccNumber").val().trim() ||
      !$("#ccExp").val().trim() ||
      !$("#ccCvv").val().trim()
    ) {
      return showForm("Compila i dati della carta (simulazione).");
    }

    try {
      setBusy(true);

      // Importo definitivo dal riepilogo/carrello
      const importo = calcImporto(checkout);

      // 1) CREA PRENOTAZIONE (backend la segna "pagato" e disattiva disponibilità del giorno)
      const body = {
        id_spazio: checkout.spazio.id,
        data: checkout.prenotazione.data,              // YYYY-MM-DD
        ora_inizio: checkout.prenotazione.ora_inizio,  // HH:MM
        ora_fine: checkout.prenotazione.ora_fine,      // HH:MM
        importo: importo
      };

      await apiPOST(`${apiConfig.apiUrl}/prenotazioni/createPrenotazione`, body, token);

      // 2) Mostra popup elegante + coriandoli e avvia redirect soft
      try { localStorage.removeItem("checkout"); } catch { }
      showSuccessPopup();   // <- mostra #pay-success e spara i coriandoli

    } catch (err) {
      console.error(err);
      showGlobal(err.message || "Errore durante la conferma della prenotazione.", "danger");
    } finally {
      setBusy(false);
    }
  });

  // ===== Helpers =====
  function showGlobal(msg, type) {
    $alertGlobal.removeClass("d-none alert-success alert-danger alert-warning")
      .addClass("alert-" + type)
      .text(msg);
  }
  function showForm(msg) { $alertForm.removeClass("d-none").text(msg); }
  function hideAlerts() { $alertGlobal.addClass("d-none"); $alertForm.addClass("d-none"); }

  function setBusy(b) {
    $btn.prop("disabled", b);
    $btnText.toggleClass("d-none", b);
    $btnWait.toggleClass("d-none", !b);
  }

  function onlyDigits(s) { return String(s || "").replace(/\D+/g, ""); }
  function prettyTipo(t) {
    if (!t) return "-";
    return String(t).replace(/_/g, " ").split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }

  function calcImporto(chk) {
    if (chk?.prenotazione?.totale_stimato != null) {
      return Number(chk.prenotazione.totale_stimato).toFixed(2);
    }
    const price = Number(chk?.spazio?.prezzo_orario || 0);
    const m1 = hhmmToMinutes(chk?.prenotazione?.ora_inizio);
    const m2 = hhmmToMinutes(chk?.prenotazione?.ora_fine);
    const ore = Math.max(0, (m2 - m1) / 60);
    return (price * ore).toFixed(2);
  }
  function hhmmToMinutes(hhmm) {
    if (!hhmm) return 0;
    const [h, m] = hhmm.split(":").map(Number);
    return (h * 60 + m);
  }

  async function apiPOST(url, body, token) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify(body)
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = json?.error || json?.message || `HTTP ${r.status}`;
      throw new Error(msg);
    }
    return json;
  }

  function showSuccessPopup() {
    // Mostra il toast in basso a destra
    $("#pay-success").removeClass("d-none");

    // Coriandoli 🎉
    shootConfetti(60);

    // Click sul bottone → vai subito al profilo
    $(document).off("click.goProfile").on("click.goProfile", "#pay-success a", function (e) {
      // lasciamo anche il default (href) per compatibilità,
      // ma forziamo la stessa destinazione per evitare popup blocker
      e.preventDefault();
      window.location.href = "profilo.html#prenotazioni";
    });

    // Redirect automatico dopo ~2s
    setTimeout(() => {
      window.location.href = "profilo.html#prenotazioni";
    }, 2000);
  }

  function shootConfetti(n = 50) {
    const holder = document.createElement("div");
    holder.className = "confetti";
    document.body.appendChild(holder);

    const colors = ["#22c55e", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];
    for (let i = 0; i < n; i++) {
      const piece = document.createElement("i");
      piece.style.left = (Math.random() * 100) + "%";
      piece.style.setProperty("--c", colors[i % colors.length]);
      piece.style.animationDelay = (Math.random() * 0.25) + "s";
      piece.style.transform = `rotate(${Math.random() * 80}deg)`;
      holder.appendChild(piece);
    }
    setTimeout(() => holder.remove(), 1800);
  }
});
