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
        const { data: last, error: eLast } = await supabase
            .from("disponibilita")
            .select("end_at")
            .eq("id_spazio", id_spazio)
            .order("end_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (eLast) throw eLast;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate = new Date(today);
        if (last?.end_at) {
            const next = new Date(last.end_at);
            next.setDate(next.getDate() + 1);
            next.setHours(0, 0, 0, 0);
            if (next > startDate) startDate = next;
        }

        const slots = [];
        for (let i = 0; i < giorni; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);

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
            .upsert(slots, {
                onConflict: "id_spazio,start_at",
                ignoreDuplicates: true
            })
            .select();
        if (error) throw error;

        return data || [];
    },

    async deleteExpired(id_spazio) {
        const nowIso = new Date().toISOString();
        const { error } = await supabase
            .from("disponibilita")
            .delete()
            .eq("id_spazio", id_spazio)
            .lt("end_at", nowIso);
        if (error) throw error;
    },
};

module.exports = disponibilitaModel;
