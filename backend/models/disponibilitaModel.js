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
            .insert([{
                id_spazio: slot.id_spazio,
                start_at: slot.start_at,
                end_at: slot.end_at,
                disponibile: true
            }])
            .select()
            .single();

        if (error) throw error;
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
        const { data: existing, error: e1 } = await supabase
            .from("disponibilita")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (e1) throw e1;
        if (!existing) return null;

        const { error: e2 } = await supabase
            .from("disponibilita")
            .delete()
            .eq("id", id);

        if (e2) throw e2;
        return existing;
    },

    async creaDisponibilitaDefault(id_spazio, giorni = 10) {
        const today = new Date();
        const slots = [];

        for (let i = 0; i < giorni; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);

            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const dateStr = `${yyyy}-${mm}-${dd}`;

            slots.push({
                id_spazio,
                start_at: `${dateStr}T08:00:00+02:00`,
                end_at: `${dateStr}T17:00:00+02:00`,
                disponibile: true
            });
        }

        const { data, error } = await supabase
            .from("disponibilita")
            .insert(slots);

        if (error) throw error;
        return data;
    }
};

module.exports = disponibilitaModel;
