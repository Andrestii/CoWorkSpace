const express = require("express");
const router = express.Router();
const spaziController = require("../controllers/spaziController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSpazio = require("../middleware/canManageSpazio");
const upload = require("../middleware/upload");

/**
 * @swagger
 * tags:
 *   name: Spazi
 *   description: Gestione degli spazi di coworking
 */

/**
 * @swagger
 * /getSpazi:
 *   get:
 *     summary: Ottiene la lista degli spazi (filtrabili per sede e servizi)
 *     tags: [Spazi]
 *     parameters:
 *       - in: query
 *         name: sede
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID della sede per filtrare gli spazi
 *       - in: query
 *         name: servizio
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         required: false
 *         description: Uno o più servizi per filtrare gli spazi (es. wifi, caffè). Puoi passare più volte il parametro.
 *         example: ["wifi","caffè"]
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
 * /createSpazio:
 *   post:
 *     summary: Crea un nuovo spazio (solo gestore)
 *     tags: [Spazi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Spazio'
 *     responses:
 *       201:
 *         description: Spazio creato con successo
 *       400:
 *         description: Dati non validi
 */
router.post(
  "/createSpazio",
  authMiddleware,
  isGestore,
  upload.single("immagine"),
  spaziController.createSpazio
);

/**
 * @swagger
 * /updateSpazio/{id}:
 *   put:
 *     summary: Aggiorna uno spazio esistente (solo gestore)
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Spazio'
 *     responses:
 *       200:
 *         description: Spazio aggiornato
 *       400:
 *         description: Dati non validi
 *       404:
 *         description: Spazio non trovato
 */
router.put(
  "/updateSpazio/:id",
  authMiddleware,
  isGestore,
  upload.single("immagine"),
  canManageSpazio("id"),
  spaziController.updateSpazio
);

/**
 * @swagger
 * /deleteSpazio/{id}:
 *   delete:
 *     summary: Elimina uno spazio (solo gestore)
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
 *         description: Spazio eliminato
 *       404:
 *         description: Spazio non trovato
 */
router.delete(
  "/deleteSpazio/:id",
  authMiddleware,
  isGestore,
  canManageSpazio("id"),
  spaziController.deleteSpazio
);

/**
 * @swagger
 * /attivaSpazio/{id}:
 *   put:
 *     summary: Attiva uno spazio (solo gestore)
 *     tags: [Spazi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dello spazio da attivare
 *     responses:
 *       200:
 *         description: Spazio attivato
 *       404:
 *         description: Spazio non trovato
 */
router.put(
  "/attivaSpazio/:id",
  authMiddleware,
  isGestore,
  canManageSpazio("id"),
  spaziController.attivaSpazio
);

/**
 * @swagger
 * /setServizi/{id}/servizi:
 *   post:
 *     summary: Imposta i servizi associati a uno spazio (solo gestore)
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
 *                 description: Lista degli ID dei servizi da associare
 *     responses:
 *       200:
 *         description: Servizi associati con successo
 *       400:
 *         description: Dati non validi
 *       404:
 *         description: Spazio non trovato
 */
router.post(
  "/setServizi/:id/servizi",
  authMiddleware,
  isGestore,
  canManageSpazio("id"),
  spaziController.setServizi
);

/**
 * @swagger
 * /{id}/servizi/add:
 *   post:
 *     summary: Aggiunge un servizio a uno spazio
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
 *               id_servizio:
 *                 type: integer
 *                 description: ID del servizio da aggiungere
 *             required:
 *               - id_servizio
 *     responses:
 *       200:
 *         description: Servizio aggiunto con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Servizio aggiunto con successo"
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Spazio o servizio non trovato
 */
router.post(
  "/:id/servizi/add",
  authMiddleware,
  isGestore,
  canManageSpazio("id"),
  spaziController.addServizio
);

/**
 * @swagger
 * /{id}/servizi/{idServizio}:
 *   delete:
 *     summary: Rimuove un servizio da uno spazio
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
 *       - in: path
 *         name: idServizio
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del servizio da rimuovere
 *     responses:
 *       200:
 *         description: Servizio rimosso con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Servizio rimosso con successo"
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Spazio o servizio non trovato
 */
router.delete(
  "/:id/servizi/:idServizio",
  authMiddleware,
  isGestore,
  canManageSpazio("id"),
  spaziController.removeServizio
);

module.exports = router;