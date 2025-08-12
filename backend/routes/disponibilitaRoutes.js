const express = require("express");
const router = express.Router();
const disponibilitaController = require("../controllers/disponibilitaController");
const auth = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSpazio = require("../middleware/canManageSpazio");

router.get("/list", disponibilitaController.list);

router.post("/create", auth, isGestore, canManageSpazio("id_spazio"), disponibilitaController.create);

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

router.get("/range", disponibilitaController.listByRange);

module.exports = router;
