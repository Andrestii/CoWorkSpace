// backend/routes/serviziRoutes.js
const express = require("express");
const router = express.Router();
const serviziController = require("../controllers/serviziController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");

/**
 * @swagger
 * tags:
 *   name: Servizi
 *   description: Gestione dei servizi offerti nelle sedi di coworking
 */

/**
 * @swagger
 * /servizi/getServizi:
 *   get:
 *     summary: Ottiene la lista di tutti i servizi disponibili
 *     tags: [Servizi]
 *     responses:
 *       200:
 *         description: Lista dei servizi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Servizio'
 */
router.get("/getServizi", serviziController.getServizi);

/**
 * @swagger
 * /servizi/createServizio:
 *   post:
 *     summary: Crea un nuovo servizio (solo gestore)
 *     tags: [Servizi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Servizio'
 *     responses:
 *       201:
 *         description: Servizio creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Servizio'
 *       400:
 *         description: Dati non validi
 */
router.post("/createServizio", authMiddleware, isGestore, serviziController.createServizio);

/**
 * @swagger
 * /servizi/deleteServizio/{id}:
 *   delete:
 *     summary: Elimina un servizio (solo gestore)
 *     tags: [Servizi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del servizio da eliminare
 *     responses:
 *       200:
 *         description: Servizio eliminato
 *       404:
 *         description: Servizio non trovato
 */
router.delete("/deleteServizio/:id", authMiddleware, isGestore, serviziController.deleteServizio);

/**
 * @swagger
 * /servizi/bySpazio/{id}:
 *   get:
 *     summary: Ottiene la lista dei servizi associati a uno spazio specifico
 *     tags: [Servizi]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dello spazio
 *     responses:
 *       200:
 *         description: Lista dei servizi dello spazio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Servizio'
 *       404:
 *         description: Spazio non trovato
 */
router.get("/bySpazio/:id", serviziController.getBySpazio);

module.exports = router;