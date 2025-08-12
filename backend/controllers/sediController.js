const sediModel = require("../models/sediModel");

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

    async createSede(req, res) {
        try {
            // 1️⃣ Creo la sede
            const sede = await sediModel.createSede(req.body);

            // 2️⃣ Se l'utente è un gestore, lo mappo su questa sede
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
            const sede = await sediModel.updateSede(req.params.id, req.body);
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
