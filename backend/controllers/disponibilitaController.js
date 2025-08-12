const disponibilitaModel = require("../models/disponibilitaModel");

const disponibilitaController = {
    async list(req, res) {
        try {
            const { id_spazio, from, to } = req.query;
            if (!id_spazio) {
                return res.status(400).json({ error: "id_spazio è richiesto" });
            }
            const rows = await disponibilitaModel.getBySpazioAndRange(
                Number(id_spazio),
                from,
                to
            );
            res.status(200).json(rows);
        } catch (err) {
            console.error("list disponibilita:", err);
            res.status(500).json({ error: err.message });
        }
    },

    async create(req, res) {
        try {
            console.log("📩 BODY ricevuto:", req.body); // <-- DEBUG

            const { id_spazio, start_at, end_at, disponibile = true, note = null } = req.body;

            if (!id_spazio || !start_at || !end_at) {
                console.warn("❌ Campi obbligatori mancanti");
                return res.status(400).json({ error: "Campi obbligatori mancanti" });
            }

            if (new Date(start_at) >= new Date(end_at)) {
                console.warn("❌ start_at >= end_at");
                return res.status(400).json({ error: "start_at deve precedere end_at" });
            }

            console.log("🔍 Controllo sovrapposizioni...");
            const overlap = await disponibilitaModel.hasOverlap({
                id_spazio: Number(id_spazio),
                start_at,
                end_at
            });

            console.log("Overlap result:", overlap);
            if (overlap) {
                return res.status(409).json({ error: "Slot sovrapposto" });
            }

            console.log("💾 Creazione record...");
            const created = await disponibilitaModel.create({
                id_spazio: Number(id_spazio),
                start_at,
                end_at,
                disponibile,
                note
            });

            console.log("✅ Creato:", created);
            res.status(201).json({ message: "Disponibilità creata", disponibilita: created });
        } catch (err) {
            console.error("❌ ERRORE in create disponibilita:", err);
            res.status(500).json({ error: "Errore interno", details: err.message });
        }
    },


    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const current = await disponibilitaModel.getById(id);
            if (!current) {
                return res.status(404).json({ error: "Slot non trovato" });
            }

            const start_at = req.body.start_at ?? current.start_at;
            const end_at = req.body.end_at ?? current.end_at;
            const disponibile = typeof req.body.disponibile === "boolean"
                ? req.body.disponibile
                : current.disponibile;
            const note = req.body.note ?? current.note;

            if (new Date(start_at) >= new Date(end_at)) {
                return res.status(400).json({ error: "start_at deve precedere end_at" });
            }

            const overlap = await disponibilitaModel.hasOverlap({
                id_spazio: current.id_spazio,
                start_at,
                end_at,
                ignoreId: id
            });
            if (overlap) {
                return res.status(409).json({ error: "Slot sovrapposto" });
            }

            const updated = await disponibilitaModel.update(id, {
                start_at,
                end_at,
                disponibile,
                note
            });

            res.status(200).json({ message: "Disponibilità aggiornata", disponibilita: updated });
        } catch (err) {
            console.error("update disponibilita:", err);
            res.status(500).json({ error: "Errore interno" });
        }
    },

    async delete(req, res) {
        try {
            const id = Number(req.params.id);
            const slot = await disponibilitaModel.delete(id);

            if (!slot) {
                return res.status(404).json({ error: "Slot non trovato" });
            }

            res.status(200).json({ message: "Slot cancellato", deleted: slot });
        } catch (err) {
            console.error("delete disponibilita:", err);
            res.status(500).json({ error: err.message || "Errore interno" });
        }
    },

    async listByRange(req, res) {
        try {
            const { id_spazio, from, to } = req.query;
            if (!id_spazio) {
                return res.status(400).json({ error: "id_spazio è richiesto" });
            }
            const rows = await disponibilitaModel.getBySpazioAndRange(
                Number(id_spazio),
                from,
                to
            );
            res.status(200).json(rows);
        } catch (err) {
            console.error("listByRange disponibilita:", err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = disponibilitaController;
