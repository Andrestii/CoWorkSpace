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
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
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
 *                   id_prenotazione:
 *                     type: integer
 *                   importo:
 *                     type: number
 *                     format: float
 *                   data_pagamento:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Non autorizzato
 */
router.get('/storico', auth, pagamentiController.storicoPagamenti);

module.exports = router;
