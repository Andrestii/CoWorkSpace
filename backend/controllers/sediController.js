const sediModel = require("../models/sediModel");
const path = require("path");
const supabase = require("../config/database");

const sediController = {
    async getAllSedi(req, res) {
        try {
            const sedi = await sediModel.getAllSediAttive();
            res.status(200).json(sedi);
        } catch (error) {
            console.error("Errore getAllSedi:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getSedeById(req, res) {
        try {
            const sede = await sediModel.getSedeById(req.params.id);
            res.status(200).json(sede);
        } catch (error) {
            console.error("Errore getSedeById:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getMieSedi(req, res) {
        try {
            const mieSedi = await sediModel.getSediByGestore(req.user.id);
            res.status(200).json(mieSedi);
        } catch (error) {
            console.error("Errore getMieSedi:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async createSede(req, res) {
        try {
            let sedeData = req.body;
            const file = req.file;
            if (file) {
                const fileName = `sedi/${Date.now()}${path.extname(file.originalname)}`;
                const { data, error } = await supabase.storage
                    .from("sedi-images")
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true,
                    });

                if (error) throw error;

                const { data: urlData } = supabase.storage
                    .from("sedi-images")
                    .getPublicUrl(fileName);

                sedeData.immagine = urlData.publicUrl;
            }
            const sede = await sediModel.createSede(sedeData);

            if (req.user.ruolo === "gestore") {
                await sediModel.addGestoreToSede(req.user.id, sede.id);
            }

            res.status(201).json(sede);
        } catch (error) {
            console.error("Errore createSede:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async updateSede(req, res) {
        try {
            let updateData = req.body;
            const file = req.file;

            if (file) {
                const fileName = `sedi/${Date.now()}${path.extname(file.originalname)}`;
                const { data, error } = await supabase.storage
                    .from("sedi-images")
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true,
                    });

                if (error) throw error;

                const { data: urlData } = supabase.storage
                    .from("sedi-images")
                    .getPublicUrl(fileName);

                updateData.immagine = urlData.publicUrl;
            }

            const sede = await sediModel.updateSede(req.params.id, updateData);
            res.status(200).json(sede);
        } catch (error) {
            console.error("Errore updateSede:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async deleteSede(req, res) {
        try {
            const sede = await sediModel.disattivaSede(req.params.id);
            res.status(200).json({ message: "Sede disattivata", sede });
        } catch (error) {
            console.error("Errore deleteSede:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async attivaSede(req, res) {
        try {
            const sede = await sediModel.attivaSede(req.params.id);
            res.status(200).json({ message: "sede riattivata", sede });
        } catch (error) {
            console.error("Errore riattivaSede", error)
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = sediController;
