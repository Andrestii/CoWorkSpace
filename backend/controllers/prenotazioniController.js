// backend/controllers/prenotazioniController.js
const prenotazioniModel = require("../models/prenotazioniModel");
const path = require("path");
const supabase = require("../config/database");

const STATI_VALIDI = ["in_attesa", "confermato", "pagato", "annullato"];

const prenotazioniController = {
    async createPrenotazione(req, res) {
        try {
            const { id_spazio, data, ora_inizio, ora_fine, importo } = req.body;
            const id_utente = req.user?.id; // preso dal token JWT

            if (!id_utente || !id_spazio || !data || !ora_inizio || !ora_fine) {
                return res.status(400).json({
                    error: "id_spazio, data, ora_inizio, ora_fine sono obbligatori"
                });
            }

            // 1) Crea la prenotazione con stato già "pagato"
            const prenotazione = await prenotazioniModel.createPrenotazione({
                ...req.body,
                id_utente,
                stato: "pagato"
            });

            // 2) Aggiorna disponibilità dello slot del giorno (08:00–17:00)
            const { error: updErr } = await supabase
                .from("disponibilita")
                .update({ disponibile: false })
                .eq("id_spazio", Number(id_spazio))
                .gte("start_at", `${data}T00:00:00+02:00`)
                .lte("end_at", `${data}T23:59:59+02:00`);

            if (updErr) {
                console.error("Errore aggiornamento disponibilità:", updErr);
            }

            res.status(201).json({ message: "Prenotazione creata", prenotazione });
        } catch (error) {
            console.error("Errore createPrenotazione:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getPrenotazioniUtente(req, res) {
        try {
            const id_utente = req.user?.id;
            if (!id_utente) return res.status(401).json({ error: "Utente non autenticato" });

            const prenotazioni = await prenotazioniModel.listByUtente(id_utente);
            res.status(200).json(prenotazioni);
        } catch (error) {
            console.error("Errore getPrenotazioniUtente:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async updateStatoPrenotazione(req, res) {
        try {
            const id = Number(req.params.id);
            const { stato } = req.body;

            if (!id) return res.status(400).json({ error: "ID non valido" });
            if (!STATI_VALIDI.includes(String(stato))) {
                return res.status(400).json({
                    error: `Stato non valido. Valori ammessi: ${STATI_VALIDI.join(", ")}`
                });
            }

            const prenotazione = await prenotazioniModel.updateStato(id, stato);
            res.status(200).json({ message: "Stato prenotazione aggiornato", prenotazione });
        } catch (error) {
            console.error("Errore updateStatoPrenotazione:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async getPrenotazioniSpazio(req, res) {
        try {
            const idSpazio = Number(req.params.id);
            if (!idSpazio) return res.status(400).json({ error: "ID spazio non valido" });

            const prenotazioni = await prenotazioniModel.listBySpazio(idSpazio);
            res.status(200).json(prenotazioni);
        } catch (error) {
            console.error("Errore getPrenotazioniSpazio:", error);
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = prenotazioniController;