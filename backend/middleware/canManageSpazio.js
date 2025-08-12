const supabase = require("../config/database");

// Consente l'azione se: admin oppure gestore mappato sulla sede dello spazio
module.exports = function canManageSpazio(paramName = "id_spazio") {
    return async function (req, res, next) {
        try {
            if (!req.user || !["gestore", "admin"].includes(req.user.ruolo)) {
                return res.status(403).json({ error: "Permesso negato" });
            }
            if (req.user.ruolo === "admin") return next();

            const idSpazio =
                req.body?.[paramName] || req.params?.[paramName] || req.query?.[paramName];
            if (!idSpazio) return res.status(400).json({ error: `Parametro ${paramName} mancante` });

            const { data: spazio, error: e1 } = await supabase
                .from("spazi")
                .select("id_sede")
                .eq("id", Number(idSpazio))
                .single();
            if (e1) throw e1;
            if (!spazio) return res.status(404).json({ error: "Spazio non trovato" });

            const { data: map, error: e2 } = await supabase
                .from("gestori_sedi")
                .select("id_utente")
                .eq("id_utente", req.user.id)
                .eq("id_sede", spazio.id_sede);
            if (e2) throw e2;

            if (!map || map.length === 0) {
                return res.status(403).json({ error: "Gestore non autorizzato su questa sede" });
            }
            next();
        } catch (err) {
            console.error("canManageSpazio error:", err);
            res.status(500).json({ error: "Errore interno" });
        }
    };
};
