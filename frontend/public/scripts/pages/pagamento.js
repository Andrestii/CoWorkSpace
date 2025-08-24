// frontend/public/scripts/pages/pagamento.js
$(function () {
  const token = localStorage.getItem("authToken");
  const $alertGlobal = $("#alertGlobal");
  const $alertForm = $("#alertForm");
  const $success = $("#successBox");
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
  try { checkout = JSON.parse(localStorage.getItem("checkout")); } catch (e) {}
  if (!checkout || !checkout.spazio || !checkout.prenotazione) {
    showGlobal("Dati carrello non trovati. Torna al carrello.", "warning");
    return;
  }

  // Populate summary
  $("#rSpazio").text(checkout.spazio.nome || "-");
  $("#rTipologia").text(prettyTipo(checkout.spazio.tipologia));
  $("#rData").text(checkout.prenotazione.data || "-");
  $("#rOrario").text((checkout.prenotazione.ora_inizio || "-") + " – " + (checkout.prenotazione.ora_fine || "-"));
  $("#rTotale").text(checkout.prenotazione.totale_stimato != null ? (Number(checkout.prenotazione.totale_stimato).toFixed(2) + " €") : "-");

  // === Formattazioni input carta ===
  $("#ccNumber").on("input", function () {
    let v = onlyDigits($(this).val());
    v = v.substring(0, 19); // max 19 cifre
    $(this).val(groupEvery4(v));
  });

  $("#ccExp").on("input", function () {
    let v = onlyDigits($(this).val());
    v = v.substring(0, 4);
    if (v.length >= 3) v = v.substring(0,2) + "/" + v.substring(2);
    $(this).val(v);
  });

  $("#ccCvv").on("input", function () {
    let v = onlyDigits($(this).val());
    v = v.substring(0, 4);
    $(this).val(v);
  });

  // === Submit pagamento ===
  $("#payForm").on("submit", async function (e) {
    e.preventDefault();
    hideAlerts();

    const ccName = $("#ccName").val().trim();
    const ccNum = onlyDigits($("#ccNumber").val());
    const ccExp = $("#ccExp").val().trim();
    const ccCvv = $("#ccCvv").val().trim();

    // Validazioni minime
    const err = validateCard(ccName, ccNum, ccExp, ccCvv);
    if (err) { showForm(err); return; }

    try {
      setBusy(true);

      // 1) CREA PRENOTAZIONE
      const prenBody = {
        id_spazio: checkout.spazio.id,
        data: checkout.prenotazione.data,              // YYYY-MM-DD
        ora_inizio: checkout.prenotazione.ora_inizio,  // HH:MM
        ora_fine: checkout.prenotazione.ora_fine,      // HH:MM
        importo: calcImporto(checkout),                // Importo ufficiale inviato al backend
      };

      const prenRes = await apiPOST(`${apiConfig.apiUrl}/prenotazioni/createPrenotazione`, prenBody, token);
      const prenId = readPrenId(prenRes);
      if (!prenId) throw new Error("Prenotazione non creata correttamente.");

      // 2) CONFERMA PAGAMENTO
      const transazioneId = genTransactionId();
      const payBody = {
        id_prenotazione: prenId,
        importo: prenBody.importo,
        metodo: "carta",
        transazione_id: transazioneId,
        valuta: "EUR",
        note: `Pagamento carta per prenotazione ${prenId}`
      };

      const payRes = await apiPOST(`${apiConfig.apiUrl}/pagamenti/conferma`, payBody, token);
      // se necessario, potresti verificare campi specifici

      // 3) Persisto info client-side e segnalo successo
      checkout.prenotazione.id = prenId;
      checkout.pagamento = { transazione_id: transazioneId, metodo: "carta", importo: prenBody.importo };
      localStorage.setItem("checkout", JSON.stringify(checkout));

      $success.removeClass("d-none");
      showGlobal("Pagamento completato e prenotazione registrata.", "success");

      // Redirect dolce (profilo o lista prenotazioni)
      setTimeout(() => location.href = "profile.html#prenotazioni", 1500);
    } catch (e2) {
      console.error(e2);
      showGlobal(e2.message || "Errore durante il pagamento.", "danger");
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
  function groupEvery4(s) { return s.replace(/(.{4})/g, "$1 ").trim(); }
  function prettyTipo(t) {
    if (!t) return "-";
    return String(t).replace(/_/g," ").split(" ")
      .map(w => w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(" ");
  }

  function validateCard(name, num, exp, cvv) {
    if (!name) return "Inserisci l'intestatario della carta.";
    if (!num || num.length < 13 || num.length > 19 || !luhn(num)) return "Numero di carta non valido.";
    if (!/^\d{2}\/\d{2}$/.test(exp)) return "Scadenza non valida. Usa MM/YY.";
    const [mm, yy] = exp.split("/").map(Number);
    if (mm < 1 || mm > 12) return "Mese di scadenza non valido.";
    // Considera 20YY
    const now = new Date();
    const fullYY = 2000 + yy;
    const lastDay = new Date(fullYY, mm, 0); // ultimo giorno del mese
    if (lastDay < new Date(now.getFullYear(), now.getMonth(), 1)) return "Carta scaduta.";
    if (!/^\d{3,4}$/.test(cvv)) return "CVV non valido.";
    return null;
  }

  function luhn(numStr) {
    let sum = 0, dbl = false;
    for (let i = numStr.length - 1; i >= 0; i--) {
      let d = parseInt(numStr[i], 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  function calcImporto(chk) {
    // Se presente totale_stimato dal carrello lo usiamo, altrimenti ricalcolo
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
    return (h*60 + m);
  }

  function genTransactionId() {
    // id univoco "CARD-YYYYMMDDHHMMSS-rand"
    const d = new Date();
    const pad = (n)=>String(n).padStart(2,"0");
    const stamp = d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
    const rnd = Math.random().toString(36).slice(2,8).toUpperCase();
    return `CARD-${stamp}-${rnd}`;
  }

  function readPrenId(res) {
    // Prova a leggere id da risposte diverse
    if (!res) return null;
    if (typeof res === "number") return res;
    if (res.id) return res.id;
    if (res.prenotazione?.id) return res.prenotazione.id;
    if (Array.isArray(res) && res[0]?.id) return res[0].id;
    return null;
  }

  async function apiPOST(url, body, token) {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(body)
    });
    const json = await r.json().catch(()=> ({}));
    if (!r.ok) {
      const msg = json?.error || json?.message || `HTTP ${r.status}`;
      throw new Error(msg);
    }
    return json;
  }
});
