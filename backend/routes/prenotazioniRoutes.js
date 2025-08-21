// backend/routes/prenotazioniRoutes.js
const express = require("express");
const router = express.Router();
const prenotazioniController = require("../controllers/prenotazioniController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");

/**
 * @swagger
 * tags:
 *   name: Prenotazioni
 *   description: Gestione delle prenotazioni degli spazi
 */

/**
 * @swagger
 * /prenotazioni/createPrenotazione:
 *   post:
 *     summary: Crea una nuova prenotazione
 *     tags: [Prenotazioni]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_disponibilita:
 *                 type: integer
 *                 description: ID della disponibilità da prenotare
 *     responses:
 *       201:
 *         description: Prenotazione creata con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 */
router.post("/createPrenotazione", authMiddleware, prenotazioniController.createPrenotazione);

/**
 * @swagger
 * /prenotazioni/getMiePrenotazioni:
 *   get:
 *     summary: Ottiene la lista delle prenotazioni dell'utente
 *     tags: [Prenotazioni]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista delle prenotazioni
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prenotazione'
 *       401:
 *         description: Non autorizzato
 */
router.get("/getMiePrenotazioni", authMiddleware, prenotazioniController.getPrenotazioniUtente);

/**
 * @swagger
 * /prenotazioni/updateStatoPrenotazione/{id}:
 *   put:
 *     summary: Aggiorna lo stato di una prenotazione
 *     tags: [Prenotazioni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della prenotazione
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stato:
 *                 type: string
 *                 enum: [confermata, rifiutata, in attesa]
 *     responses:
 *       200:
 *         description: Stato aggiornato con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato
 *       404:
 *         description: Prenotazione non trovata
 */
router.put("/updateStatoPrenotazione/:id", authMiddleware, isGestore, prenotazioniController.updateStatoPrenotazione);

/**
 * @swagger
 * /prenotazioni/getPrenotazioniSpazio/{id_spazio}:
 *   get:
 *     summary: Ottiene la lista delle prenotazioni per uno spazio specifico
 *     tags: [Prenotazioni]
 *     parameters:
 *       - in: path
 *         name: id_spazio
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dello spazio
 *     responses:
 *       200:
 *         description: Lista delle prenotazioni dello spazio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prenotazione'
 *       404:
 *         description: Spazio non trovato
 */
router.get("/getPrenotazioniSpazio/:id", prenotazioniController.getPrenotazioniSpazio);

module.exports = router;