const pagamentiModel = require('../models/pagamentiModel');
const path = require("path");
const supabase = require("../config/database");

module.exports = {
    // POST /api/pagamenti/conferma
    async confermaPagamento(req, res) {
        try {
            const user = req.user; // { id, ruolo }
            const { id_prenotazione, importo, metodo, transazione_id, valuta, note } = req.body;

            if (!id_prenotazione || !importo || !metodo) {
                return res.status(400).json({ error: 'id_prenotazione, importo e metodo sono obbligatori' });
            }

            // 1) Carico prenotazione
            const pren = await pagamentiModel.getPrenotazioneById(Number(id_prenotazione));
            if (!pren) return res.status(404).json({ error: 'Prenotazione non trovata' });

            // 2) Permessi: proprietario o staff
            const isOwner = pren.id_utente === user.id;
            const isStaff = ['admin', 'gestore'].includes(user.ruolo);
            if (!isOwner && !isStaff) return res.status(403).json({ error: 'Non autorizzato' });

            // 3) Stato prenotazione
            if (pren.stato === 'annullato') return res.status(400).json({ error: 'Prenotazione annullata' });
            if (pren.stato === 'pagato') {
                // idempotenza: se già pagata prova a recuperare il pagamento esistente
                const existing = await pagamentiModel.getPagamentoByPrenotazione(pren.id);
                return res.status(200).json({ message: 'Già pagata', pagamento: existing, prenotazione: pren });
            }

            // 4) Idempotenza lato PSP
            if (transazione_id) {
                const dup = await pagamentiModel.getPagamentoByTransazione(transazione_id);
                if (dup) {
                    // allinea prenotazione se serve e ritorna
                    if (pren.stato !== 'pagato') await pagamentiModel.aggiornaPrenotazionePagata(pren.id, transazione_id);
                    return res.status(200).json({ message: 'Pagamento già registrato', pagamento: dup, prenotazione: { ...pren, stato: 'pagato' } });
                }
            }

            // 5) Coerenza importo
            const dovuto = Number(pren.importo || 0);
            if (Number(importo) + 0.001 < dovuto) {
                return res.status(400).json({ error: `Importo insufficiente. Dovuto: ${dovuto}` });
            }

            // 6) Inserisci pagamento
            const pagamento = await pagamentiModel.inserisciPagamento({
                id_prenotazione: pren.id,
                id_utente: pren.id_utente,
                importo: Number(importo),
                metodo: String(metodo).toLowerCase(),
                transazione_id: transazione_id || null,
                valuta: (valuta || 'EUR').toUpperCase(),
                note: note || null
            });

            // 7) Aggiorna prenotazione -> pagato
            const prenUpdated = await pagamentiModel.aggiornaPrenotazionePagata(pren.id, transazione_id || null);

            return res.status(200).json({ pagamento, prenotazione: prenUpdated });
        } catch (err) {
            console.error('confermaPagamento:', err);
            res.status(500).json({ error: err.message || 'Errore interno' });
        }
    },

    // GET /api/pagamenti/storico
    async storicoPagamenti(req, res) {
        try {
            const { from, to, limit, offset } = req.query;
            const data = await pagamentiModel.getStoricoPagamentiUtente({
                userId: req.user.id,
                from,
                to,
                limit: Number(limit || 50),
                offset: Number(offset || 0)
            });
            res.json(data);
        } catch (err) {
            console.error('storicoPagamenti:', err);
            res.status(500).json({ error: err.message || 'Errore interno' });
        }
    }
};
