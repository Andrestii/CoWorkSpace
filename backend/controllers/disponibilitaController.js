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
            const { id_spazio } = req.body;
            if (!id_spazio) {
                return res.status(400).json({ error: "id_spazio è obbligatorio" });
            }

            await disponibilitaModel.deleteExpired(Number(id_spazio));

            const created = await disponibilitaModel.creaDisponibilitaDefault(
                Number(id_spazio),
                10 // giorni
            );

            res.status(201).json({
                message: "Disponibilità aggiornate (08:00–17:00)",
                count: created.length
            });
        } catch (err) {
            console.error("❌ ERRORE create disponibilita:", err);
            res.status(500).json({ error: err.message });
        }
    },

    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const current = await disponibilitaModel.getById(id);
            if (!current) {
                return res.status(404).json({ error: "Slot non trovato" });
            }

            const ora_inizio = req.body.ora_inizio;
            const ora_fine = req.body.ora_fine;

            if (!ora_inizio || !ora_fine) {
                return res.status(400).json({ error: "ora_inizio e ora_fine sono obbligatori" });
            }

            const date = current.start_at.slice(0, 10); // YYYY-MM-DD
            const start_at = `${date}T${ora_inizio.length === 5 ? ora_inizio + ":00" : ora_inizio}+02:00`;
            const end_at = `${date}T${ora_fine.length === 5 ? ora_fine + ":00" : ora_fine}+02:00`;

            if (new Date(start_at) >= new Date(end_at)) {
                return res.status(400).json({ error: "L'orario di inizio deve precedere l'orario di fine" });
            }

            const updated = await disponibilitaModel.update(id, { start_at, end_at });

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
