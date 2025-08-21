const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pagamentiController = require('../controllers/pagamentiController');

/**
 * @swagger
 * tags:
 *   name: Pagamenti
 *   description: Gestione dei pagamenti delle prenotazioni
 */

/**
 * @swagger
 * /pagamenti/conferma:
 *   post:
 *     summary: Conferma un pagamento
 *     tags: [Pagamenti]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_prenotazione:
 *                 type: integer
 *                 description: ID della prenotazione da pagare
 *               importo:
 *                 type: number
 *                 format: float
 *                 description: Importo del pagamento
 *             required:
 *               - id_prenotazione
 *               - importo
 *     responses:
 *       200:
 *         description: Pagamento confermato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pagamento confermato con successo"
 *       400:
 *         description: Dati non validi o importo non corretto
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Prenotazione non trovata
 */
router.post('/conferma', auth, pagamentiController.confermaPagamento);

/**
 * @swagger
 * /pagamenti/storico:
 *   get:
 *     summary: Restituisce lo storico dei pagamenti dell'utente autenticato
 *     tags: [Pagamenti]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dei pagamenti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_pagamento:
 *                     type: integer
 *                     description: ID univoco del pagamento
 *                   id_prenotazione:
 *                     type: integer
 *                     description: ID della prenotazione associata
 *                   importo:
 *                     type: number
 *                     format: float
 *                     description: Importo pagato
 *                   data_pagamento:
 *                     type: string
 *                     format: date-time
 *                     description: Data e ora del pagamento
 *                   stato:
 *                     type: string
 *                     enum: [confermato, in attesa, rifiutato]
 *                     description: Stato attuale del pagamento
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore interno del server
 */
router.get('/storico', auth, pagamentiController.storicoPagamenti);

module.exports = router;
