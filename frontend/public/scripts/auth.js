const Auth = {
    // Ottieni i dati dell'utente (decodifica il JWT)
    getUserData: function () {
        const token = localStorage.getItem("authToken");
        if (!token) return null;

        // Cache dei dati utente
        if (this._userData) return this._userData;

        this._userData = this.parseJwt(token);
        return this._userData;
    },

    // Ottieni solo l'ID dell'utente
    getUserId: function () {
        const userData = this.getUserData();
        return userData ? userData.id : null;
    },

    // Ottieni il ruolo dell'utente
    getUserRole: function () {
        const userData = this.getUserData();
        return userData ? userData.ruolo : null;
    },

    // Verifica se l'utente è loggato
    isLoggedIn: function () {
        return !!localStorage.getItem("authToken");
    },

    // Logout
    logout: function () {
        localStorage.removeItem("authToken");
        this._userData = null;
    },

    // Decodifica JWT
    parseJwt: function (token) {
        if (!token) return null;

        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Errore nella decodifica del JWT:", error);
            return null;
        }
    },
};
