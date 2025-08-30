// backend/models/serviziModel.js
const supabase = require("../config/database");

const TABLE_SERVIZI = "servizi";
const TABLE_SPAZI_SERVIZI = "spazi_servizi";

class ServiziModel {
    async listByName(nome) {
        let q = supabase.from(TABLE_SERVIZI).select("*").eq("attivo", true);
        if (nome) q = q.ilike("nome", `%${nome}%`); // filtro case-insensitive
        const { data, error } = await q.order("id", { ascending: true });
        if (error) throw error;
        return data;
    }

    async createServizio(payload) {
        const body = {
            nome: String(payload.nome || "").trim(),
            attivo: payload.attivo !== undefined ? !!payload.attivo : true,
        };

        const { data, error } = await supabase
            .from(TABLE_SERVIZI)
            .insert(body)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // soft delete → disattiva servizio
    async softDeleteServizio(id) {
        const { data, error } = await supabase
            .from(TABLE_SERVIZI)
            .update({ attivo: false })
            .eq("id", Number(id))
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getServiziBySpazio(idSpazio) {
        const { data, error } = await supabase
            .from(TABLE_SPAZI_SERVIZI)
            .select(`
                servizi: ${TABLE_SERVIZI} (id, nome, attivo)
            `)
            .eq("id_spazio", Number(idSpazio));

        if (error) throw error;
        // normalizza l’array: estrai direttamente i servizi
        return (data || []).map(r => r.servizi).filter(Boolean);
    }
}

module.exports = new ServiziModel();