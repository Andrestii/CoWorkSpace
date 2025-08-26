// backend/routes/prenotazioniRoutes.js
const express = require("express");
const router = express.Router();
const prenotazioniController = require("../controllers/prenotazioniController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const isAdmin = require("../middleware/isAdmin");

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
 *     summary: Crea una nuova prenotazione per l'utente autenticato
 *     tags: [Prenotazioni]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prenotazione'
 *     responses:
 *       201:
 *         description: Prenotazione creata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prenotazione'
 *       400:
 *         description: Dati non validi
 */
router.post("/createPrenotazione", authMiddleware, prenotazioniController.createPrenotazione);

/**
 * @swagger
 * /prenotazioni/getMiePrenotazioni:
 *   get:
 *     summary: Ottiene tutte le prenotazioni dell'utente autenticato
 *     tags: [Prenotazioni]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista delle prenotazioni dell'utente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prenotazione'
 */
router.get("/getMiePrenotazioni", authMiddleware, prenotazioniController.getPrenotazioniUtente);

/**
 * @swagger
 * /prenotazioni/updateStatoPrenotazione/{id}:
 *   put:
 *     summary: Aggiorna lo stato di una prenotazione (solo gestore)
 *     tags: [Prenotazioni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della prenotazione da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stato:
 *                 type: string
 *                 description: Nuovo stato della prenotazione
 *     responses:
 *       200:
 *         description: Stato prenotazione aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prenotazione'
 *       400:
 *         description: Dati non validi
 *       404:
 *         description: Prenotazione non trovata
 */
router.put("/updateStatoPrenotazione/:id", authMiddleware, isGestore, prenotazioniController.updateStatoPrenotazione);

/**
 * @swagger
 * /prenotazioni/getPrenotazioniSpazio/{id}:
 *   get:
 *     summary: Ottiene tutte le prenotazioni di uno spazio specifico
 *     tags: [Prenotazioni]
 *     parameters:
 *       - in: path
 *         name: id
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

/**
 * @swagger
 * /prenotazioni/getAllPrenotazioni:
 *   get:
 *     summary: Ottiene tutte le prenotazioni (filtro opzionale per sede)
 *     tags: [Prenotazioni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sede
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID della sede per filtrare
 *     responses:
 *       200:
 *         description: Lista delle prenotazioni
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.get("/getAllPrenotazioni", authMiddleware, isAdmin, prenotazioniController.getAllPrenotazioni
);

module.exports = router;