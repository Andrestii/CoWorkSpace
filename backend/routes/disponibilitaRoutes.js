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
 *     summary: Ottiene la lista completa delle disponibilità
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
 *             $ref: '#/components/schemas/Disponibilita'
 *     responses:
 *       201:
 *         description: Disponibilità creata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Disponibilita'
 *       400:
 *         description: Dati non validi
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
 *             $ref: '#/components/schemas/Disponibilita'
 *     responses:
 *       200:
 *         description: Disponibilità aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Disponibilita'
 *       404:
 *         description: Slot non trovato
 *       400:
 *         description: Dati non validi
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
 *         description: Disponibilità eliminata
 *       404:
 *         description: Slot non trovato
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
