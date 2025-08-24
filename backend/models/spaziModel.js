const supabase = require("../config/database");

const TABLE_SPAZI = "spazi";
const TABLE_SPAZI_SERVIZI = "spazi_servizi";

class SpaziModel {
    async listBySede(idSede) {
        let q = supabase
            .from(TABLE_SPAZI)
            .select(`
                *,
                spazi_servizi (
                    id_servizio,
                    servizi ( id, nome )
                )
            `)
            .eq("attivo", true);

        if (idSede) q = q.eq("id_sede", idSede);

        const { data, error } = await q.order("id", { ascending: true });
        if (error) throw error;
        return data;
    }

    async createSpazio(payload) {
        const body = {
            id_sede: Number(payload.id_sede),
            nome: String(payload.nome || "").trim(),
            descrizione: payload.descrizione || null,
            tipologia: String(payload.tipologia),
            capienza: payload.capienza !== undefined ? Number(payload.capienza) : null,
            prezzo_orario: Number(payload.prezzo_orario),
            attivo: payload.attivo !== undefined ? !!payload.attivo : true,
            immagine: payload.immagine || null,
        };

        const { data, error } = await supabase.from(TABLE_SPAZI).insert(body).select().single();
        if (error) throw error;
        return data;
    }

    async updateSpazio(id, changes) {
        const toUpdate = {};
        if (changes.nome !== undefined) toUpdate.nome = String(changes.nome).trim();
        if (changes.descrizione !== undefined) toUpdate.descrizione = changes.descrizione;
        if (changes.tipologia !== undefined) toUpdate.tipologia = String(changes.tipologia);
        if (changes.capienza !== undefined) toUpdate.capienza = Number(changes.capienza);
        if (changes.prezzo_orario !== undefined) toUpdate.prezzo_orario = Number(changes.prezzo_orario);
        if (changes.attivo !== undefined) toUpdate.attivo = !!changes.attivo;
        if (changes.immagine !== undefined) toUpdate.immagine = changes.immagine;

        const { data, error } = await supabase.from(TABLE_SPAZI).update(toUpdate).eq("id", Number(id)).select().single();
        if (error) throw error;
        return data;
    }

    async softDeleteSpazio(id) {
        const { data, error } = await supabase
            .from(TABLE_SPAZI)
            .update({ attivo: false })
            .eq("id", Number(id))
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async softActiveSpazio(id) {
        const { data, error } = await supabase
            .from(TABLE_SPAZI)
            .update({ attivo: true })
            .eq("id", Number(id))
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async setServizi(spazioId, serviziIds = []) {
        const del = await supabase.from(TABLE_SPAZI_SERVIZI).delete().eq("id_spazio", Number(spazioId));
        if (del.error) throw del.error;

        if (!serviziIds.length) return [];

        const rows = serviziIds.map((idServizio) => ({
            id_spazio: Number(spazioId),
            id_servizio: Number(idServizio),
        }));

        const { data, error } = await supabase.from(TABLE_SPAZI_SERVIZI).insert(rows).select();
        if (error) throw error;
        return data;
    }

    async listBySedeAndServizio(idSede, servizioNome) {
        let q = supabase
            .from(TABLE_SPAZI)
            .select(`
                *,
                spazi_servizi (
                    servizi ( id, nome )
                )
            `)
            .eq("attivo", true);

        if (idSede) q = q.eq("id_sede", idSede);
        if (servizioNome) q = q.ilike("spazi_servizi.servizi.nome", `%${servizioNome}%`);

        const { data, error } = await q.order("id", { ascending: true });
        if (error) throw error;
        return data;
    }

    async addServizioToSpazio(spazioId, servizioId) {
        // usa upsert per evitare errore su duplicati (PK: id_spazio, id_servizio)
        const { data, error } = await supabase
            .from("spazi_servizi")
            .upsert({ id_spazio: Number(spazioId), id_servizio: Number(servizioId) }, { onConflict: "id_spazio,id_servizio" })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async removeServizioFromSpazio(spazioId, servizioId) {
        const { data, error } = await supabase
            .from("spazi_servizi")
            .delete()
            .eq("id_spazio", Number(spazioId))
            .eq("id_servizio", Number(servizioId))
            .select();
        if (error) throw error;
        return data;
    }

}

module.exports = new SpaziModel();
