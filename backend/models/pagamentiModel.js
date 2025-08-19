const supabase = require('../config/database');

async function getPrenotazioneById(id) {
    const { data, error } = await supabase
        .from('prenotazioni')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

async function getPagamentoByTransazione(transazioneId) {
    if (!transazioneId) return null;
    const { data, error } = await supabase
        .from('pagamenti')
        .select('*')
        .eq('transazione_id', transazioneId)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function getPagamentoByPrenotazione(idPrenotazione) {
    const { data, error } = await supabase
        .from('pagamenti')
        .select('*')
        .eq('id_prenotazione', idPrenotazione)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function inserisciPagamento({ id_prenotazione, id_utente, importo, metodo, transazione_id, valuta = 'EUR', note = null }) {
    const { data, error } = await supabase
        .from('pagamenti')
        .insert([{ id_prenotazione, id_utente, importo, metodo, transazione_id, valuta, note, stato: 'succeeded' }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function aggiornaPrenotazionePagata(idPrenotazione, transazioneId) {
    const { data, error } = await supabase
        .from('prenotazioni')
        .update({ stato: 'pagato', id_transazione_pagamento: transazioneId || null })
        .eq('id', idPrenotazione)
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function getStoricoPagamentiUtente({ userId, from, to, limit = 50, offset = 0 }) {
    const { data, error } = await supabase
        .from('pagamenti')
        .select(`
                    *,
                    prenotazioni!inner(
                        id,
                        importo,
                        stato,
                        id_spazio
                    )
                `)
        .eq('id_utente', userId)
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
}


module.exports = {
    getPrenotazioneById,
    getPagamentoByTransazione,
    getPagamentoByPrenotazione,
    inserisciPagamento,
    aggiornaPrenotazionePagata,
    getStoricoPagamentiUtente
};
