const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader)
            return res.status(401).json({ error: "Authorization header required" });

        const token = authHeader.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Token required" });

        // Verifica il token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Opzionale: carica l'utente dal database
        const userData = await userModel.getUserById(decoded.id);
        if (!userData) return res.status(401).json({ error: "User not found" });

        if (userData.isBanned) {
            // se l'utente è bannato
            return res
                .status(403)
                .json({ error: "Account sospeso, contatta l'assistenza." });
        }

        // Imposta l'utente nella richiesta
        req.user = userData;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }

        res.status(500).json({ error: "Authentication error" });
    }
};
module.exports = authMiddleware;
