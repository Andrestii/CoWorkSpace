const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");


router.post("/register", upload.single("profileImage"), userController.register);

router.post("/login", userController.login);

router.get("/me", authMiddleware, userController.getCurrentUser);

router.put("/profile", authMiddleware, userController.updateProfile);

router.post("/profile-image", authMiddleware, upload.single("profileImage"), userController.updateProfileImage);

router.get("/getUserCount", authMiddleware, userController.getUserCount);

router.get("/getAllUsers", authMiddleware, userController.getAllUsers);

router.put("/ban/:id", authMiddleware, userController.banUser);

router.put("/unban/:id", authMiddleware, userController.unbanUser);

router.put("/updateInfo/:id", authMiddleware, userController.updateUserInfo);

module.exports = router;
