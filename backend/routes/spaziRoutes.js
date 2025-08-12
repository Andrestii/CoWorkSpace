// backend/routes/spaziRoutes.js
const express = require("express");
const router = express.Router();
const spaziController = require("../controllers/spaziController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const isAdmin = require("../middleware/isAdmin");

// Middleware combinato (gestore o admin)
const isGestoreOrAdmin = (req, res, next) => {
    if (req.user?.ruolo === "gestore" || req.user?.ruolo === "admin") {
        return next();
    }
    return res.status(403).json({ error: "Permesso negato" });
};

// Pubblico: lista spazi (filtrabile per sede)
router.get("/getSpazi", spaziController.getSpazi);

router.post("/createSpazio", authMiddleware, isGestoreOrAdmin, spaziController.createSpazio);

router.put("/updateSpazio/:id", authMiddleware, isGestoreOrAdmin, spaziController.updateSpazio);

router.delete("/deleteSpazio/:id", authMiddleware, isGestoreOrAdmin, spaziController.deleteSpazio);

router.put("/attivaSpazio/:id", authMiddleware, isGestoreOrAdmin, spaziController.attivaSpazio);

router.post("/setServizi/:id/servizi", authMiddleware, isGestoreOrAdmin, spaziController.setServizi);

module.exports = router;
