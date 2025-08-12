const supabase = require("../config/database");

// Middleware: consente l'azione se admin oppure gestore mappato sulla sede dello spazio
module.exports = function canManageSpazio(paramName = "id_spazio") {
    return async function (req, res, next) {
        try {
            // 1. Controllo ruolo utente
            if (!req.user || !["gestore", "admin"].includes(req.user.ruolo)) {
                return res.status(403).json({ error: "Permesso negato" });
            }

            // 2. Admin bypassa controlli
            if (req.user.ruolo === "admin") return next();

            // 3. Recupero id_spazio da body, params o query
            const rawValue =
                req.body?.[paramName] ||
                req.params?.[paramName] ||
                req.query?.[paramName];

            const idSpazio = Number(rawValue);

            if (!rawValue || isNaN(idSpazio) || idSpazio <= 0) {
                return res.status(400).json({
                    error: `Parametro ${paramName} mancante o non valido`
                });
            }

            // 4. Recupero id_sede dello spazio
            const { data: spazio, error: e1 } = await supabase
                .from("spazi")
                .select("id_sede")
                .eq("id", idSpazio)
                .single();

            if (e1) throw e1;
            if (!spazio) {
                return res.status(404).json({ error: "Spazio non trovato" });
            }

            // 5. Verifico se l'utente è gestore di quella sede
            const { data: map, error: e2 } = await supabase
                .from("gestori_sedi")
                .select("id_utente")
                .eq("id_utente", req.user.id)
                .eq("id_sede", spazio.id_sede);

            if (e2) throw e2;
            if (!map || map.length === 0) {
                return res.status(403).json({
                    error: "Gestore non autorizzato su questa sede"
                });
            }

            // 6. Tutto ok → passo al prossimo middleware
            next();
        } catch (err) {
            console.error("canManageSpazio error:", err);
            res.status(500).json({ error: "Errore interno" });
        }
    };
};
