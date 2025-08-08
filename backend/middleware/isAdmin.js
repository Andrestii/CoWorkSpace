module.exports = function (req, res, next) {
    if (req.user && req.user.ruolo === "admin") {
        next();
    } else {
        res.status(403).json({ error: "Accesso riservato agli admin" });
    }
};
