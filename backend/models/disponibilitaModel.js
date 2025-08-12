const supabase = require("../config/database");

const disponibilitaModel = {
    async getById(id) {
        const { data, error } = await supabase
            .from("disponibilita")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async getBySpazioAndRange(id_spazio, from, to) {
        let query = supabase
            .from("disponibilita")
            .select("*")
            .eq("id_spazio", id_spazio)
            .order("start_at", { ascending: true });

        if (from) query = query.gte("start_at", from);
        if (to) query = query.lte("end_at", to);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async create(slot) {
        console.log("📝 Inserimento in disponibilita:", slot);
        const { data, error } = await supabase
            .from("disponibilita")
            .insert([slot])
            .select()
            .single();

        if (error) {
            console.error("❌ Errore Supabase insert:", error);
            throw error;
        }
        return data;
    },

    async update(id, fields) {
        const { data, error } = await supabase
            .from("disponibilita")
            .update(fields)
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async hasOverlap({ id_spazio, start_at, end_at, ignoreId = null }) {
        const { data: existing, error } = await supabase
            .from("disponibilita")
            .select("id, start_at, end_at")
            .eq("id_spazio", id_spazio);

        if (error) throw error;

        return existing.some(s => {
            if (ignoreId && s.id === ignoreId) return false;

            const existingStart = new Date(s.start_at);
            const existingEnd = new Date(s.end_at);
            const newStart = new Date(start_at);
            const newEnd = new Date(end_at);

            // Controlla se gli slot si sovrappongono
            return existingStart < newEnd && existingEnd > newStart;
        });
    },

    async delete(id) {
        // Recupera lo slot senza eccezione
        const { data: existing, error: e1 } = await supabase
            .from("disponibilita")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (e1) throw e1;
        if (!existing) return null;

        // Elimina
        const { error: e2 } = await supabase
            .from("disponibilita")
            .delete()
            .eq("id", id);

        if (e2) throw e2;
        return existing;
    },

    async getBySpazioAndRange(id_spazio, from, to) {
        let query = supabase
            .from("disponibilita")
            .select("*")
            .eq("id_spazio", id_spazio)
            .order("start_at", { ascending: true });

        if (from) query = query.gte("start_at", from);
        if (to) query = query.lte("end_at", to);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};

module.exports = disponibilitaModel;
