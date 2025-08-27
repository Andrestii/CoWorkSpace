const spaziModel = require("../models/spaziModel");
const path = require("path");
const supabase = require("../config/database");

const TIPI_VALIDI = ["postazione", "ufficio", "sala_riunioni"];

class SpaziController {
    // === GET /api/spazi?sede=ID&servizio=wifi ===
    async getSpazi(req, res) {
        try {
            const sedeId = req.query.sede ? Number(String(req.query.sede).replace(/\D/g, "")) : undefined;
            const servizio = req.query.servizio ? String(req.query.servizio).trim() : undefined;

            const spazi = await spaziModel.listBySedeAndServizio(sedeId, servizio);

            // 🔽 trasformo i servizi in array di nomi
            const result = spazi.map(spazio => ({
                ...spazio,
                servizi: (spazio.spazi_servizi || []).map(ss => ss.servizi?.nome)
            }));

            res.status(200).json(result);
        } catch (error) {
            console.error("Errore getSpazi:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // === POST /api/spazi ===
    async createSpazio(req, res) {
        try {
            const { id_sede, nome, tipologia, prezzo_orario } = req.body;

            if (!id_sede || !nome || !tipologia || prezzo_orario === undefined) {
                return res.status(400).json({ error: "id_sede, nome, tipologia, prezzo_orario sono obbligatori" });
            }
            if (!TIPI_VALIDI.includes(String(tipologia))) {
                return res.status(400).json({ error: `tipologia non valida. Valori: ${TIPI_VALIDI.join(", ")}` });
            }

            let payload = { ...req.body };
            const file = req.file;

            if (file) {
                const fileName = `spazi/${Date.now()}${path.extname(file.originalname)}`;
                const { error } = await supabase.storage
                    .from("spazi-images")
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true,
                    });
                if (error) throw error;

                const { data: urlData } = supabase.storage.from("spazi-images").getPublicUrl(fileName);
                payload.immagine = urlData.publicUrl;
            }

            const spazio = await spaziModel.createSpazio(payload);
            res.status(201).json({ message: "Spazio creato", spazio });
        } catch (error) {
            console.error("Errore createSpazio:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // === PUT /api/spazi/:id ===
    async updateSpazio(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ error: "ID non valido" });

            if (req.body.tipologia && !TIPI_VALIDI.includes(String(req.body.tipologia))) {
                return res.status(400).json({ error: `tipologia non valida. Valori: ${TIPI_VALIDI.join(", ")}` });
            }

            let changes = { ...req.body };
            const file = req.file;

            delete changes.id;
            delete changes.id_spazio;
            delete changes.id_sede;

            if (changes.capienza !== undefined) changes.capienza = Number(changes.capienza);
            if (changes.prezzo_orario !== undefined) changes.prezzo_orario = Number(changes.prezzo_orario);
            if (changes.attivo !== undefined) changes.attivo = Number(changes.attivo) === 1 || changes.attivo === true;

            if (file) {
                const fileName = `spazi/${Date.now()}${path.extname(file.originalname)}`;
                const { error } = await supabase.storage
                    .from("spazi-images")
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true,
                    });
                if (error) throw error;

                const { data: urlData } = supabase.storage.from("spazi-images").getPublicUrl(fileName);
                changes.immagine = urlData.publicUrl;
            }

            const spazio = await spaziModel.updateSpazio(id, changes);
            res.status(200).json({ message: "Spazio aggiornato", spazio });
        } catch (error) {
            console.error("Errore updateSpazio:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // === DELETE /api/spazi/:id ===
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
    }

    // === PUT /api/spazi/:id/attiva ===
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
    }

    // === POST /api/spazi/:id/servizi ===
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
    }

    // POST /api/spazi/:id/servizi/add
    async addServizio(req, res) {
        try {
            const spazioId = Number(req.params.id);
            const servizioId = Number(req.body.id_servizio);
            if (!spazioId || !servizioId) {
                return res.status(400).json({ error: "id spazio e id_servizio sono obbligatori" });
            }
            const row = await spaziModel.addServizioToSpazio(spazioId, servizioId);
            res.status(201).json({ message: "Servizio aggiunto allo spazio", row });
        } catch (err) {
            console.error("Errore addServizio:", err);
            res.status(500).json({ error: err.message });
        }
    }

    // DELETE /api/spazi/:id/servizi/:idServizio
    async removeServizio(req, res) {
        try {
            const spazioId = Number(req.params.id);
            const servizioId = Number(req.params.idServizio);
            if (!spazioId || !servizioId) {
                return res.status(400).json({ error: "ID non validi" });
            }
            await spaziModel.removeServizioFromSpazio(spazioId, servizioId);
            res.status(200).json({ message: "Servizio rimosso dallo spazio" });
        } catch (err) {
            console.error("Errore removeServizio:", err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new SpaziController();
