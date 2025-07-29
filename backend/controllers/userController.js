const userModel = require("../models/userModel");
const supabase = require("../config/database");
var jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accetta solo immagini
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Solo i file immagine sono permessi!"), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite di 5MB per file
});

require("dotenv").config();
const userController = {
    /**
     * Register a new user
     */
    async register(req, res) {
        try {
            let { email, password, nome, ruolo, descrizione, numero_telefono, data_nascita } = req.body;
            const profileImageFile = req.file;
            let profileImageUrl = null;

            // Validate required fields
            if (!email || !password || !nome || !ruolo) {
                return res.status(400).json({
                    error: "Email, password, and full name are required",
                });
            }

            if (profileImageFile) {
                const fileName = `profile-images/${Date.now()}_${path.extname(
                    profileImageFile.originalname
                )}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("profile-pics")
                    .upload(fileName, profileImageFile.buffer, {
                        contentType: profileImageFile.mimetype,
                        cacheControl: "3600", // Cache per 1 ora
                        upsert: false, // Non sovrascrivere se esiste già (opzionale)
                    });

                if (uploadError) {
                    console.error(
                        "Errore durante l'upload dell'immagine a Supabase Storage:",
                        uploadError
                    );
                    // Non bloccare la registrazione se l'upload fallisce, ma logga l'errore
                } else if (uploadData) {
                    // Ottieni l'URL pubblico dell'immagine caricata
                    const { data: urlData } = supabase.storage
                        .from("profile-pics")
                        .getPublicUrl(fileName);
                    profileImageUrl = urlData.publicUrl;
                    console.log("Immagine profilo caricata:", profileImageUrl);
                }
            }

            fullName = nome.split(" ");
            nome = fullName
                .map(
                    (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                )
                .join(" "); // Prime letterre del nome maiuscole

            // Create the user
            const data = await userModel.createUser({
                email,
                password,
                nome,
                ruolo,
                descrizione: descrizione || null,
                numero_telefono: numero_telefono || null,
                data_nascita: data_nascita || null,
                profile_image: profileImageUrl,
            });


            console.log("User created:", data);

            const userData = data.user[0];

            var token = jwt.sign(
                {
                    id: userData.id,
                    email: userData.email,
                    ruolo: userData.ruolo,
                },
                process.env.JWT_SECRET, // Secret key
                { expiresIn: process.env.JWT_EXPIRES_IN } // Scadenza (24h)
            );

            res.status(201).json({
                message: "User registered successfully",
                user: data,
                token: token,
            });
        } catch (error) {
            console.error("Error registering user:", error);

            // Safely check for error messages
            const errorMessage = error?.message || JSON.stringify(error);

            // Handle duplicate email error
            if (
                errorMessage.includes("duplicate") ||
                errorMessage.includes("already exists")
            ) {
                return res.status(409).json({ error: "Email already in use" });
            }

            res.status(500).json({ error: errorMessage });
        }
    },

    /**
     * Login user
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res
                    .status(400)
                    .json({ error: "Email and password are required" });
            }

            const result = await userModel.loginUser(email, password);

            if (result.error) {
                return res.status(401).json({ error: result.error });
            }

            console.log("Login successful:", result);
            const payload = {
                id: result.user.id,
                email: result.user.email,
                ruolo: result.user.ruolo,
                // Aggiungi altri dati utente essenziali se necessario (es. nome)
                // nome: result.user.nome
            };

            if (result.user.ruolo === "artigiano" && result.user.shop_id) {
                payload.shop_id = result.user.shop_id;
                console.log(
                    `Artisan logged in. Adding shop_id ${payload.shop_id} to JWT payload.`
                ); // Log per debug
            }

            var token = jwt.sign(
                payload,
                process.env.JWT_SECRET, // Secret key
                { expiresIn: process.env.JWT_EXPIRES_IN } // Scadenza (24h)
            );

            res.status(200).json({
                user: result.user,
                session: result.session,
                token: token,
            });
        } catch (error) {
            console.error("Login error:", error);
            res
                .status(500)
                .json({ error: error.message || "An error occurred during login" });
        }
    },

    /**
     * Get the current user's profile
     */
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.id; // Assuming auth middleware sets req.user

            const userData = await userModel.getUserById(userId);

            if (!userData) {
                return res.status(404).json({ error: "User not found" });
            }

            res.status(200).json(userData);
        } catch (error) {
            console.error("Error getting current user:", error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Update the current user's profile
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.id; // From auth middleware
            const { nome, numero_telefono, descrizione } = req.body;

            const updatedData = await userModel.updateUserProfile(userId, {
                nome: nome,
                numero_telefono,
                descrizione,
            });

            res.status(200).json({
                message: "Profile updated successfully",
                user: updatedData,
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // Update propic of user
    async updateProfileImage(req, res) {
        try {
            const userId = req.user.id;
            const profileImageFile = req.file;

            if (!profileImageFile) {
                return res.status(400).json({ error: "Nessun file ricevuto" });
            }

            const fileName = `profile_${userId}_${Date.now()}${path.extname(profileImageFile.originalname)}`;

            const { data, error } = await supabase.storage
                .from("profile-pics")
                .upload(fileName, profileImageFile.buffer, {
                    contentType: profileImageFile.mimetype,
                    upsert: true,
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from("profile-pics")
                .getPublicUrl(fileName);

            const publicURL = urlData.publicUrl;

            await userModel.updateUserProfile(userId, { profile_image: publicURL });

            res.status(200).json({
                message: "Immagine profilo aggiornata",
                imageUrl: publicURL,
            });
        } catch (error) {
            console.error("Errore aggiornamento immagine:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getUserCount(req, res) {
        try {
            const count = await userModel.getUserCount();
            res.status(200).json({ count });
        } catch (error) {
            console.error("Error fetching user count:", error);
            res.status(500).json({ error: error.message });
        }
    },
    async getAllUsers(req, res) {
        try {
            const users = await userModel.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            console.error("Error fetching all users:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async banUser(req, res) {
        const { reason, expiresAt } = req.body;
        await userModel.update(req.params.id, {
            isBanned: true,
        });
        res.status(200).json({ message: "Utente bannato" });
    },

    async unbanUser(req, res) {
        await userModel.update(req.params.id, {
            isBanned: false,
        });
        res.status(200).json({ message: "Utente sbannato" });
    },

    async updateUserInfo(req, res) {
        const userId = req.params.id;
        const { nome, cognome, email, numeroTelefono, dataNascita } = req.body;

        if (!nome || !numeroTelefono) {
            return res.status(400).json({
                error: "Nome, telefono e indirizzo sono richiesti",
            });
        }

        try {
            const updatedUser = await userModel.update(userId, {
                nome: `${nome} ${cognome}`,
                email,
                numero_telefono: numeroTelefono,
                data_nascita: dataNascita,
            });

            res.status(200).json({
                message: "Informazioni utente aggiornate con successo",
                user: updatedUser,
            });
        } catch (error) {
            console.error("Error updating user info:", error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = userController;
