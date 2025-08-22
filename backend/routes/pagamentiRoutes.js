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
 *     summary: Conferma il pagamento di una prenotazione
 *     tags: [Pagamenti]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfermaPagamento'
 *     responses:
 *       200:
 *         description: Pagamento confermato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pagamento'
 *       400:
 *         description: Dati non validi
 */
router.post('/conferma', auth, pagamentiController.confermaPagamento);

/**
 * @swagger
 * /pagamenti/conferma:
 *   post:
 *     summary: Conferma il pagamento di una prenotazione
 *     tags: [Pagamenti]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfermaPagamento'
 *     responses:
 *       200:
 *         description: Pagamento confermato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pagamento'
 *       400:
 *         description: Dati non validi
 */
router.get('/storico', auth, pagamentiController.storicoPagamenti);

module.exports = router;
