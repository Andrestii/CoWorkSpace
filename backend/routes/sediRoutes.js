const express = require("express");
const router = express.Router();
const sediController = require("../controllers/sediController");
const authMiddleware = require("../middleware/auth");
const isGestore = require("../middleware/isGestore");
const canManageSede = require("../middleware/canManageSede");


router.get("/getAllSedi", sediController.getAllSedi);

router.get("/getAllSedi/:id", sediController.getSedeById);

router.post("/createSede", authMiddleware, isGestore, sediController.createSede);

router.put("/updateSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.updateSede);

router.delete("/deleteSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.deleteSede);

router.put("/attivaSede/:id", authMiddleware, isGestore, canManageSede("id"), sediController.attivaSede);

module.exports = router;
