// backend/controllers/spaziController.js
const spaziModel = require("../models/spaziModel");

const TIPI_VALIDI = ["postazione", "ufficio", "sala_riunioni"];

const spaziController = {
    // GET /api/spazi?sede=ID
    async getSpazi(req, res) {
        try {
            const sedeId = req.query.sede ? Number(String(req.query.sede).replace(/\D/g, "")) : undefined;
            const spazi = await spaziModel.listBySede(sedeId);
            res.status(200).json(spazi);
        } catch (error) {
            console.error("Errore getSpazi:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /api/spazi
    async createSpazio(req, res) {
        try {
            const { id_sede, nome, tipologia, prezzo_orario } = req.body;

            if (!id_sede || !nome || !tipologia || prezzo_orario === undefined) {
                return res.status(400).json({ error: "id_sede, nome, tipologia, prezzo_orario sono obbligatori" });
            }
            if (!TIPI_VALIDI.includes(String(tipologia))) {
                return res.status(400).json({ error: `tipologia non valida. Valori: ${TIPI_VALIDI.join(", ")}` });
            }

            const spazio = await spaziModel.createSpazio(req.body);
            res.status(201).json({ message: "Spazio creato", spazio });
        } catch (error) {
            console.error("Errore createSpazio:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // PUT /api/spazi/:id
    async updateSpazio(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ error: "ID non valido" });

            if (req.body.tipologia && !TIPI_VALIDI.includes(String(req.body.tipologia))) {
                return res.status(400).json({ error: `tipologia non valida. Valori: ${TIPI_VALIDI.join(", ")}` });
            }

            const spazio = await spaziModel.updateSpazio(id, req.body);
            res.status(200).json({ message: "Spazio aggiornato", spazio });
        } catch (error) {
            console.error("Errore updateSpazio:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // DELETE /api/spazi/:id  (soft delete → attivo=false)
    async deleteSpazio(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ error: "ID non valido" });

            const spazio = await spaziModel.softDeleteSpazio(id);
            res.status(200).json({ message: "Spazio disattivato", spazio });
        } catch (error) {
            console.error("Errore deleteSpazio:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // PUT /api/spazi/:id  (soft attiva → attivo=true)
    async attivaSpazio(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ error: "ID non valido" });

            const spazio = await spaziModel.softActiveSpazio(id);
            res.status(200).json({ message: "Spazio attivato", spazio });
        } catch (error) {
            console.error("Errore attivaSpazio:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // POST /api/spazi/:id/servizi  { servizi: [1,2,3] }
    async setServizi(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ error: "ID non valido" });

            const servizi = Array.isArray(req.body.servizi) ? req.body.servizi.map(Number) : [];
            const collegamenti = await spaziModel.setServizi(id, servizi);
            res.status(200).json({ message: "Servizi aggiornati", collegamenti });
        } catch (error) {
            console.error("Errore setServizi:", error);
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = spaziController;
