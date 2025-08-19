// backend/routes/serviziRoutes.js
const express = require("express");
const router = express.Router();
const serviziController = require("../controllers/serviziController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");

// Pubblico: lista servizi (eventualmente filtrabile per nome)
router.get("/getServizi", serviziController.getServizi);          // GET /api/servizi?nome=...

// Solo gestore/admin: crea servizio
router.post("/createServizio", authMiddleware, isGestore, serviziController.createServizio);

// Solo gestore/admin: aggiorna servizio
router.put("/updateServizio/:id", authMiddleware, isGestore, serviziController.updateServizio);

// Solo gestore/admin: elimina servizio
router.delete("/deleteServizio/:id", authMiddleware, isGestore, serviziController.deleteServizio);

module.exports = router;