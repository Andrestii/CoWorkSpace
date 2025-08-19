const express = require("express");
const router = express.Router();
const sediController = require("../controllers/sediController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSede = require("../middleware/canManageSede");

/**
 * @swagger
 * tags:
 *   name: Sedi
 *   description: Gestione delle sedi di coworking
 */

/**
 * @swagger
 * /sedi/getAllSedi:
 *   get:
 *     summary: Restituisce la lista di tutte le sedi
 *     tags: [Sedi]
 *     responses:
 *       200:
 *         description: Lista delle sedi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sede'
 */
router.get("/getAllSedi", sediController.getAllSedi);

/**
 * @swagger
 * /sedi/getAllSedi/{id}:
 *   get:
 *     summary: Restituisce una sede specifica tramite ID
 *     tags: [Sedi]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della sede da recuperare
 *     responses:
 *       200:
 *         description: Dettagli della sede
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sede'
 *       404:
 *         description: Sede non trovata
 */
router.get("/getAllSedi/:id", sediController.getSedeById);

/**
 * @swagger
 * /sedi/createSede:
 *   post:
 *     summary: Crea una nuova sede
 *     tags: [Sedi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sede'
 *     responses:
 *       201:
 *         description: Sede creata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sede'
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Solo i gestori possono creare sedi
 */
router.post("/createSede", authMiddleware, isGestore, sediController.createSede);

/**
 * @swagger
 * /sedi/updateSede/{id}:
 *   put:
 *     summary: Aggiorna una sede esistente
 *     tags: [Sedi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della sede da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sede'
 *     responses:
 *       200:
 *         description: Sede aggiornata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sede'
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questa sede
 *       404:
 *         description: Sede non trovata
 */
router.put("/updateSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.updateSede);

/**
 * @swagger
 * /sedi/deleteSede/{id}:
 *   delete:
 *     summary: Elimina una sede esistente
 *     tags: [Sedi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della sede da eliminare
 *     responses:
 *       200:
 *         description: Sede eliminata con successo
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questa sede
 *       404:
 *         description: Sede non trovata
 */
router.delete("/deleteSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.deleteSede);

/**
 * @swagger
 * /sedi/attivaSede/{id}:
 *   put:
 *     summary: Attiva/disattiva una sede esistente
 *     tags: [Sedi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della sede da attivare/disattivare
 *     responses:
 *       200:
 *         description: Stato della sede modificato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sede'
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questa sede
 *       404:
 *         description: Sede non trovata
 */
router.put("/attivaSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.attivaSede);

module.exports = router;
