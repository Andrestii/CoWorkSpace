// backend/routes/prenotazioniRoutes.js
const express = require("express");
const router = express.Router();
const prenotazioniController = require("../controllers/prenotazioniController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");

// 🟢 Utente autenticato: crea prenotazione
router.post("/createPrenotazione", authMiddleware, prenotazioniController.createPrenotazione);

// 🟢 Utente autenticato: lista delle proprie prenotazioni
router.get("/getMiePrenotazioni", authMiddleware, prenotazioniController.getMiePrenotazioni);

// 🔴 Solo gestore/admin: cambia stato di una prenotazione
router.put("/updateStatoPrenotazione/:id", authMiddleware, isGestore, prenotazioniController.updateStatoPrenotazione);

// 🟢 Pubblico o autenticato: lista prenotazioni di uno spazio
router.get("/getPrenotazioniSpazio/:id_spazio", prenotazioniController.getPrenotazioniSpazio);

module.exports = router;