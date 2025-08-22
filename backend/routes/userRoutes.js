const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const isAdmin = require("../middleware/isAdmin");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestione degli utenti
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dati non validi
 */
router.post("/register", upload.single("profileImage"), userController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Effettua il login dell'utente
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLoginResponse'
 *       401:
 *         description: Credenziali non valide
 */
router.post("/login", userController.login);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Ottiene i dati dell'utente autenticato
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dati dell'utente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get("/me", authMiddleware, userController.getCurrentUser);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Aggiorna il profilo dell'utente autenticato
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdate'
 *     responses:
 *       200:
 *         description: Profilo aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dati non validi
 */
router.put("/profile", authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /users/profile-image:
 *   post:
 *     summary: Aggiorna l'immagine del profilo dell'utente autenticato
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Nuova immagine profilo
 *     responses:
 *       200:
 *         description: Immagine aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dati non validi
 */
router.post("/profile-image", authMiddleware, upload.single("profileImage"), userController.updateProfileImage);

/**
 * @swagger
 * /users/getUserCount:
 *   get:
 *     summary: Ottiene il numero totale di utenti
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Numero utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get("/getUserCount", authMiddleware, userController.getUserCount);

/**
 * @swagger
 * /users/getAllUsers:
 *   get:
 *     summary: Ottiene la lista di tutti gli utenti
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/getAllUsers", authMiddleware, userController.getAllUsers);

/**
 * @swagger
 * /users/ban/{id}:
 *   put:
 *     summary: Bana un utente (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dell'utente da bannare
 *     responses:
 *       200:
 *         description: Utente bannato
 *       404:
 *         description: Utente non trovato
 */
router.put("/ban/:id", authMiddleware, isAdmin, userController.banUser);

/**
 * @swagger
 * /users/unban/{id}:
 *   put:
 *     summary: Sbanna un utente (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dell'utente da sbannare
 *     responses:
 *       200:
 *         description: Utente sbannato
 *       404:
 *         description: Utente non trovato
 */
router.put("/unban/:id", authMiddleware, isAdmin, userController.unbanUser);

/**
 * @swagger
 * /users/updateInfo/{id}:
 *   put:
 *     summary: Aggiorna le informazioni di un utente (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dell'utente da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdate'
 *     responses:
 *       200:
 *         description: Informazioni utente aggiornate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dati non validi
 *       404:
 *         description: Utente non trovato
 */
router.put("/updateInfo/:id", authMiddleware, userController.updateUserInfo);

module.exports = router;
