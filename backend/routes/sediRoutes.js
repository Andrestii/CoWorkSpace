const express = require("express");
const router = express.Router();
const sediController = require("../controllers/sediController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSede = require("../middleware/canManageSede");
const upload = require("../middleware/upload");

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
 *     summary: Ottiene la lista di tutte le sedi
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
 *     summary: Ottiene i dettagli di una sede tramite ID
 *     tags: [Sedi]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della sede
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
 * /sedi/mie:
 *   get:
 *     summary: Ottiene tutte le sedi del gestore autenticato
 *     tags: [Sedi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista sedi del gestore
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sede'
 *       401:
 *         description: Non autorizzato
 */
router.get("/mie", authMiddleware, isGestore, sediController.getMieSedi);

/**
 * @swagger
 * /sedi/createSede:
 *   post:
 *     summary: Crea una nuova sede (solo gestore)
 *     tags: [Sedi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 */
router.post("/createSede", authMiddleware, isGestore, upload.single("immagine"), sediController.createSede);

/**
 * @swagger
 * /sedi/updateSede/{id}:
 *   put:
 *     summary: Aggiorna una sede esistente (solo gestore)
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Sede'
 *     responses:
 *       200:
 *         description: Sede aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sede'
 *       400:
 *         description: Dati non validi
 *       404:
 *         description: Sede non trovata
 */
router.put("/updateSede/:id", authMiddleware, isGestore, canManageSede("id"), upload.single("immagine"), sediController.updateSede);

/**
 * @swagger
 * /sedi/deleteSede/{id}:
 *   delete:
 *     summary: Elimina una sede (solo gestore)
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
 *         description: Sede eliminata
 *       404:
 *         description: Sede non trovata
 */
router.delete("/deleteSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.deleteSede);

/**
 * @swagger
 * /sedi/attivaSede/{id}:
 *   put:
 *     summary: Attiva una sede (solo gestore)
 *     tags: [Sedi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della sede da attivare
 *     responses:
 *       200:
 *         description: Sede attivata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sede'
 *       404:
 *         description: Sede non trovata
 */
router.put("/attivaSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.attivaSede);

module.exports = router;
