// backend/controllers/serviziController.js
const serviziModel = require("../models/serviziModel");
const path = require("path");
const supabase = require("../config/database");

const serviziController = {
    async getServizi(req, res) {
        try {
            const nome = req.query.nome ? String(req.query.nome).trim() : undefined;
            const servizi = await serviziModel.listByName(nome);
            res.status(200).json(servizi);
        } catch (error) {
            console.error("Errore getServizi:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async createServizio(req, res) {
        try {
            const { nome } = req.body;

            if (!nome) {
                return res.status(400).json({ error: "Il campo 'nome' è obbligatorio" });
            }

            const servizio = await serviziModel.createServizio({ nome });
            res.status(201).json({ message: "Servizio creato", servizio });
        } catch (error) {
            console.error("Errore createServizio:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async deleteServizio(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ error: "ID non valido" });

            const servizio = await serviziModel.softDeleteServizio(id);
            res.status(200).json({ message: "Servizio disattivato", servizio });
        } catch (error) {
            console.error("Errore deleteServizio:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getBySpazio(req, res) {
        try {
            const idSpazio = Number(req.params.id);
            if (!idSpazio) {
                return res.status(400).json({ error: "Parametro 'id' (spazio) mancante o non valido" });
            }

            const servizi = await serviziModel.getServiziBySpazio(idSpazio);

            // filtra solo attivi
            const onlyActive = Array.isArray(servizi) ? servizi.filter(s => s?.attivo) : [];

            res.status(200).json(onlyActive);
        } catch (error) {
            console.error("Errore getBySpazio:", error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = serviziController;