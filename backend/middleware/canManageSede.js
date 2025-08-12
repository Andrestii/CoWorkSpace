const supabase = require("../config/database");

// Per rotte tipo /sedi/:id
module.exports = function canManageSede(paramName = "id") {
    return async function (req, res, next) {
        try {
            if (!req.user || !["gestore", "admin"].includes(req.user.ruolo)) {
                return res.status(403).json({ error: "Permesso negato" });
            }
            if (req.user.ruolo === "admin") return next();

            const idSede = req.params?.[paramName] || req.body?.[paramName];
            if (!idSede) return res.status(400).json({ error: `Parametro ${paramName} mancante` });

            const { data: map, error } = await supabase
                .from("gestori_sedi")
                .select("id_utente")
                .eq("id_utente", req.user.id)
                .eq("id_sede", Number(idSede));
            if (error) throw error;

            if (!map || map.length === 0) {
                return res.status(403).json({ error: "Gestore non autorizzato su questa sede" });
            }
            next();
        } catch (err) {
            console.error("canManageSede error:", err);
            res.status(500).json({ error: "Errore interno" });
        }
    };
};
