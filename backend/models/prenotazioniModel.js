// backend/models/prenotazioniModel.js
const supabase = require("../config/database");

const TABLE_PRENOTAZIONI = "prenotazioni";

class PrenotazioniModel {
    // Crea una nuova prenotazione
    async createPrenotazione(payload) {
        const body = {
            id_utente: Number(payload.id_utente),
            id_spazio: Number(payload.id_spazio),
            data: payload.data, // formato: YYYY-MM-DD
            ora_inizio: payload.ora_inizio, // formato: HH:MM:SS
            ora_fine: payload.ora_fine,     // formato: HH:MM:SS
            importo: payload.importo !== undefined ? Number(payload.importo) : null,
            stato: payload.stato || "pagato",
            id_transazione_pagamento: payload.id_transazione_pagamento || null,
        };

        const { data, error } = await supabase
            .from(TABLE_PRENOTAZIONI)
            .insert(body)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Restituisce le prenotazioni dell'utente loggato
    async listByUtente(idUtente) {
        const { data, error } = await supabase
            .from(TABLE_PRENOTAZIONI)
            .select("*")
            .eq("id_utente", Number(idUtente))
            .order("data_creazione", { ascending: false });

        if (error) throw error;
        return data;
    }

    // Aggiorna stato di una prenotazione (confermato/pagato/annullato)
    async updateStato(id, nuovoStato) {
        const { data, error } = await supabase
            .from(TABLE_PRENOTAZIONI)
            .update({ stato: String(nuovoStato) })
            .eq("id", Number(id))
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Restituisce le prenotazioni di uno spazio (per gestore/admin)
    async listBySpazio(idSpazio) {
        const { data, error } = await supabase
            .from(TABLE_PRENOTAZIONI)
            .select(`
                        *,
                        utente:utenti ( id, nome, email )
                    `)
            .eq("id_spazio", Number(idSpazio))
            .order("data", { ascending: true })
            .order("ora_inizio", { ascending: true });


        if (error) throw error;
        return data;
    }
}

module.exports = new PrenotazioniModel();