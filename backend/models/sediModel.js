const supabase = require("../config/database");
const { attivaSede } = require("../controllers/sediController");

const sediModel = {
    async getAllSediAttive() {
        const { data, error } = await supabase
            .from("sedi")
            .select("*")
            .eq("attiva", true);
        if (error) throw error;
        return data;
    },

    async getSedeById(id) {
        const { data, error } = await supabase
            .from("sedi")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    async getSediByGestore(idGestore) {
        const { data, error } = await supabase
            .from("sedi")
            .select("*, gestori_sedi!inner(id_utente)")
            .eq("gestori_sedi.id_utente", idGestore)
            .eq("attiva", true);

        if (error) throw error;
        return data;
    },

    async createSede(sedeData) {
        sedeData.attiva = true;
        const { data, error } = await supabase
            .from("sedi")
            .insert([sedeData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async addGestoreToSede(id_utente, id_sede) {
        const { error } = await supabase
            .from("gestori_sedi")
            .insert([{ id_utente, id_sede }]);
        if (error) throw error;
        return { id_utente, id_sede };
    },

    async updateSede(id, updateData) {
        const { data, error } = await supabase
            .from("sedi")
            .update(updateData)
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    async disattivaSede(id) {
        return await this.updateSede(id, { attiva: false });
    },

    async attivaSede(id) {
        return await this.updateSede(id, { attiva: true });
    }
};

module.exports = sediModel;
