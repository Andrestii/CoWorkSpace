const multer = require("multer");

// Configurazione del file in memoria
const storage = multer.memoryStorage();

// Configurazione multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limite
    },
    fileFilter: (req, file, cb) => {
        // Accetta solo immagini
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Solo i file immagine sono supportati"), false);
        }
    },
});

module.exports = upload;
