// backend/routes/spaziRoutes.js
const express = require("express");
const router = express.Router();
const spaziController = require("../controllers/spaziController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSpazio = require("../middleware/canManageSpazio");

// Pubblico: lista spazi (filtrabile per sede)
router.get("/getSpazi", spaziController.getSpazi);

router.post("/createSpazio", authMiddleware, isGestore, spaziController.createSpazio);

router.put("/updateSpazio/:id", authMiddleware, isGestore, canManageSpazio("id"), spaziController.updateSpazio);

router.delete("/deleteSpazio/:id", authMiddleware, isGestore, canManageSpazio("id"), spaziController.deleteSpazio);

router.put("/attivaSpazio/:id", authMiddleware, isGestore, canManageSpazio("id"), spaziController.attivaSpazio);

router.post("/setServizi/:id/servizi", authMiddleware, isGestore, canManageSpazio("id"), spaziController.setServizi);

module.exports = router;
