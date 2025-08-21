// backend/routes/serviziRoutes.js
const express = require("express");
const router = express.Router();
const serviziController = require("../controllers/serviziController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");

// Pubblico: lista servizi
router.get("/getServizi", serviziController.getServizi);

// Solo gestore/admin: crea servizio
router.post("/createServizio", authMiddleware, isGestore, serviziController.createServizio);

// Solo gestore/admin: disattiva servizio
router.delete("/deleteServizio/:id", authMiddleware, isGestore, serviziController.deleteServizio);

module.exports = router;