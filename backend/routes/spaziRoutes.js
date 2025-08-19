// backend/routes/spaziRoutes.js
const express = require("express");
const router = express.Router();
const spaziController = require("../controllers/spaziController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSpazio = require("../middleware/canManageSpazio");

/**
 * @swagger
 * tags:
 *   name: Spazi
 *   description: Gestione degli spazi di coworking
 */

/**
 * @swagger
 * /spazi/getSpazi:
 *   get:
 *     summary: Restituisce la lista di tutti gli spazi
 *     tags: [Spazi]
 *     responses:
 *       200:
 *         description: Lista degli spazi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Spazio'
 */
router.get("/getSpazi", spaziController.getSpazi);

/**
 * @swagger
 * /spazi/createSpazio:
 *   post:
 *     summary: Crea un nuovo spazio
 *     tags: [Spazi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Spazio'
 *     responses:
 *       201:
 *         description: Spazio creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Spazio'
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Solo i gestori possono creare spazi
 */
router.post("/createSpazio", authMiddleware, isGestore, spaziController.createSpazio);

/**
 * @swagger
 * /spazi/updateSpazio/{id}:
 *   put:
 *     summary: Aggiorna uno spazio esistente
 *     tags: [Spazi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dello spazio da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Spazio'
 *     responses:
 *       200:
 *         description: Spazio aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Spazio'
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Spazio non trovato
 */
router.put("/updateSpazio/:id", authMiddleware, isGestore, canManageSpazio("id"), spaziController.updateSpazio);

/**
 * @swagger
 * /spazi/deleteSpazio/{id}:
 *   delete:
 *     summary: Elimina uno spazio esistente
 *     tags: [Spazi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dello spazio da eliminare
 *     responses:
 *       200:
 *         description: Spazio eliminato con successo
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Spazio non trovato
 */
router.delete("/deleteSpazio/:id", authMiddleware, isGestore, canManageSpazio("id"), spaziController.deleteSpazio);

/**
 * @swagger
 * /spazi/attivaSpazio/{id}:
 *   put:
 *     summary: Attiva/disattiva uno spazio esistente
 *     tags: [Spazi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dello spazio da attivare/disattivare
 *     responses:
 *       200:
 *         description: Stato dello spazio modificato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Spazio'
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Spazio non trovato
 */
router.put("/attivaSpazio/:id", authMiddleware, isGestore, canManageSpazio("id"), spaziController.attivaSpazio);

/**
 * @swagger
 * /spazi/setServizi/{id}/servizi:
 *   post:
 *     summary: Imposta i servizi per uno spazio
 *     tags: [Spazi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dello spazio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               servizi:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array di ID dei servizi
 *     responses:
 *       200:
 *         description: Servizi impostati con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Spazio non trovato
 */
router.post("/setServizi/:id/servizi", authMiddleware, isGestore, canManageSpazio("id"), spaziController.setServizi);

module.exports = router;
