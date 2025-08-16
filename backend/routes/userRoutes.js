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
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               ruolo:
 *                 type: string
 *                 enum: [cliente, gestore, admin]
 *                 example: cliente
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *       400:
 *         description: Dati non validi
 */
router.post("/register", upload.single("profileImage"), userController.register);

/**
 * @swagger
 *  /users/login:
 *   post:
 *     summary: Effettua il login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *       401:
 *         description: Credenziali non valide
 */
router.post("/login", userController.login);

/**
 * @swagger
 *  /users/me:
 *   get:
 *     summary: Ottiene i dati dell'utente corrente
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dati utente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autorizzato
 */
router.get("/me", authMiddleware, userController.getCurrentUser);

/**
 * @swagger
 *  /users/profile:
 *   put:
 *     summary: Aggiorna il profilo utente
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 */
router.put("/profile", authMiddleware, userController.updateProfile);

/**
 * @swagger
 *  /users/profile-image:
 *   post:
 *     summary: Aggiorna l'immagine del profilo
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
 *     responses:
 *       200:
 *         description: Immagine aggiornata con successo
 *       400:
 *         description: File non valido
 *       401:
 *         description: Non autorizzato
 */
router.post("/profile-image", authMiddleware, upload.single("profileImage"), userController.updateProfileImage);

/**
 * @swagger
 *  /users/getUserCount:
 *   get:
 *     summary: Ottiene il numero totale di utenti
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Numero di utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       401:
 *         description: Non autorizzato
 */
router.get("/getUserCount", authMiddleware, userController.getUserCount);

/**
 * @swagger
 *  /users/getAllUsers:
 *   get:
 *     summary: Ottiene la lista di tutti gli utenti
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista degli utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autorizzato
 */
router.get("/getAllUsers", authMiddleware, userController.getAllUsers);

/**
 * @swagger
 *  /users/ban/{id}:
 *   put:
 *     summary: Banna un utente
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
 *         description: Utente bannato con successo
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Solo gli admin possono bannare
 *       404:
 *         description: Utente non trovato
 */
router.put("/ban/:id", authMiddleware, isAdmin, userController.banUser);

/**
 * @swagger
 *  /users/unban/{id}:
 *   put:
 *     summary: Rimuove il ban di un utente
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
 *         description: Ban rimosso con successo
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato - Solo gli admin possono rimuovere i ban
 *       404:
 *         description: Utente non trovato
 */
router.put("/unban/:id", authMiddleware, isAdmin, userController.unbanUser);

/**
 * @swagger
 *  /users/updateInfo/{id}:
 *   put:
 *     summary: Aggiorna le informazioni di un utente
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Informazioni aggiornate con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Utente non trovato
 */
router.put("/updateInfo/:id", authMiddleware, userController.updateUserInfo);

module.exports = router;
