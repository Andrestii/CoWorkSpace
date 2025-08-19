// backend/models/serviziModel.js
const supabase = require("../config/database");

const TABLE_SERVIZI = "servizi";

class ServiziModel {
    async listByName(nome) {
        let q = supabase.from(TABLE_SERVIZI).select("*");
        if (nome) q = q.ilike("nome", `%${nome}%`); // filtro case-insensitive
        const { data, error } = await q.order("id", { ascending: true });
        if (error) throw error;
        return data;
    }

    async createServizio(payload) {
        const body = {
            nome: String(payload.nome || "").trim(),
        };

        const { data, error } = await supabase
            .from(TABLE_SERVIZI)
            .insert(body)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateServizio(id, changes) {
    const toUpdate = {};
    if (changes.nome !== undefined) {
        toUpdate.nome = String(changes.nome).trim();
    }

    const { data, error } = await supabase
        .from(TABLE_SERVIZI)
        .update(toUpdate)
        .eq("id", Number(id))
        .select()
        .single();

    if (error) throw error;
    return data;
}
}

module.exports = new ServiziModel();
