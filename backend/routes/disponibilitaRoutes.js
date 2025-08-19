const express = require("express");
const router = express.Router();
const disponibilitaController = require("../controllers/disponibilitaController");
const auth = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSpazio = require("../middleware/canManageSpazio");

/**
 * @swagger
 * tags:
 *   name: Disponibilità
 *   description: Gestione delle disponibilità degli spazi di coworking
 */

/**
 * @swagger
 * /disponibilita/list:
 *   get:
 *     summary: Ottiene la lista di tutte le disponibilità
 *     tags: [Disponibilità]
 *     responses:
 *       200:
 *         description: Lista delle disponibilità
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Disponibilita'
 */
router.get("/list", disponibilitaController.list);

/**
 * @swagger
 * /disponibilita/create:
 *   post:
 *     summary: Crea una nuova disponibilità
 *     tags: [Disponibilità]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_spazio:
 *                 type: integer
 *                 description: ID dello spazio
 *               data_inizio:
 *                 type: string
 *                 format: date-time
 *                 description: Data e ora di inizio disponibilità
 *               data_fine:
 *                 type: string
 *                 format: date-time
 *                 description: Data e ora di fine disponibilità
 *             required:
 *               - id_spazio
 *               - data_inizio
 *               - data_fine
 *     responses:
 *       201:
 *         description: Disponibilità creata con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 */
router.post("/create", auth, isGestore, canManageSpazio("id_spazio"), disponibilitaController.create);

/**
 * @swagger
 * /disponibilita/update/{id}:
 *   put:
 *     summary: Aggiorna una disponibilità esistente
 *     tags: [Disponibilità]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della disponibilità da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data_inizio:
 *                 type: string
 *                 format: date-time
 *                 description: Nuova data e ora di inizio
 *               data_fine:
 *                 type: string
 *                 format: date-time
 *                 description: Nuova data e ora di fine
 *             required:
 *               - data_inizio
 *               - data_fine
 *     responses:
 *       200:
 *         description: Disponibilità aggiornata con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Slot non trovato
 *       500:
 *         description: Errore interno del server
 */
router.put("/update/:id", auth, isGestore, async (req, res, next) => {
    const disponibilitaModel = require("../models/disponibilitaModel");
    try {
        const slot = await disponibilitaModel.getById(Number(req.params.id));
        if (!slot) return res.status(404).json({ error: "Slot non trovato" });
        req.params.id_spazio = slot.id_spazio;
        return require("../middleware/canManageSpazio")("id_spazio")(req, res, next);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Errore interno" });
    }
}, disponibilitaController.update);

/**
 * @swagger
 * /disponibilita/delete/{id}:
 *   delete:
 *     summary: Elimina una disponibilità
 *     tags: [Disponibilità]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della disponibilità da eliminare
 *     responses:
 *       200:
 *         description: Disponibilità eliminata con successo
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Non hai i permessi per gestire questo spazio
 *       404:
 *         description: Slot non trovato
 *       500:
 *         description: Errore interno del server
 */
router.delete(
    "/delete/:id",
    auth,
    isGestore,
    async (req, res, next) => {
        const disponibilitaModel = require("../models/disponibilitaModel");
        try {
            const slot = await disponibilitaModel.getById(Number(req.params.id));
            if (!slot) return res.status(404).json({ error: "Slot non trovato" });
            req.params.id_spazio = slot.id_spazio;
            return require("../middleware/canManageSpazio")("id_spazio")(req, res, next);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: "Errore interno" });
        }
    },
    disponibilitaController.delete
);

/**
 * @swagger
 * /disponibilita/range:
 *   get:
 *     summary: Ottiene la lista delle disponibilità in un intervallo di date
 *     tags: [Disponibilità]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data di inizio (YYYY-MM-DD)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Data di fine (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista delle disponibilità nell'intervallo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Disponibilita'
 *       400:
 *         description: Parametri non validi
 */
router.get("/range", disponibilitaController.listByRange);

module.exports = router;
