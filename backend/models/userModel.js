const supabase = require("../config/database");
const argon2 = require("argon2");
const userModel = {
    /**
     * Get a user by their ID
     */
    async getUserById(id) {
        const { data, error } = await supabase
            .from("utenti")
            .select("id, nome, email, ruolo, profile_image, numero_telefono, data_nascita, descrizione, isBanned")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get a user by their email
     */
    async getUserByEmail(email) {
        const { data, error } = await supabase
            .from("utenti")
            .select("*")
            .eq("email", email)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new user
     */
    async createUser(userData) {
        const hashed = await argon2.hash(String(userData.password));

        const { data, error } = await supabase
            .from("utenti")
            .insert([
                {
                    nome: userData.nome,
                    email: userData.email,
                    password: hashed,
                    ruolo: userData.ruolo,
                    profile_image: userData.profile_image || null,
                    numero_telefono: userData.numero_telefono || null,
                    data_nascita: userData.data_nascita || null,
                    descrizione: userData.descrizione || null,
                },
            ])
            .select("id, nome, email, ruolo, profile_image, numero_telefono, data_nascita, descrizione, isBanned");

        if (error) throw error;

        const sessionToken =
            Math.random().toString(36).substring(2) + Date.now().toString(36);

        return {
            user: data,
            session: {
                access_token: sessionToken,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
        };
    },


    /**
     * Update a user's profile
     */
    async updateUserProfile(userId, profileData) {
        const { data, error } = await supabase
            .from("utenti")
            .update(profileData)
            .eq("id", userId)
            .select("id, nome, email, ruolo, profile_image, numero_telefono, data_nascita, descrizione, isBanned")
            .single();
        if (error) throw error;
        return data;
    },

    /**
     * Delete a user
     */
    async deleteUser(userId) {
        // Delete from profiles first due to foreign key
        const { error: profileError } = await supabase
            .from("utenti")
            .delete()
            .eq("id", userId);

        if (profileError) throw profileError;

        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;

        return { success: true };
    },

    async getUserCount() {
        const { data, error } = await supabase
            .from("utenti")
            .select("*", { count: "exact" });

        if (error) throw error;

        return data.length;
    },

    /**
     * Login a user using direct database query
     */
    async loginUser(email, password) {
        const { data, error } = await supabase
            .from("utenti")
            .select("id, email, nome, ruolo, profile_image, password, isBanned")
            .eq("email", email)
            .single();

        if (error) throw error;

        if (!data) {
            return { error: "Invalid email or password" };
        }

        const banned =
            data.isBanned === true ||
            data.isBanned === 1 ||
            String(data.isBanned).toLowerCase() === "true";

        if (banned) {
            return { error: "Account sospeso, contatta l'assistenza.", httpStatus: 403 };
        }

        let ok = false;
        try { ok = await argon2.verify(data.password, String(password)); } catch { }

        if (!ok && data.password === String(password)) {
            const newHash = await argon2.hash(String(password));
            await supabase.from("utenti").update({ password: newHash }).eq("id", data.id);
            ok = true;
        }

        if (!ok) return { error: "Invalid email or password" };

        const userToReturn = {
            id: data.id,
            email: data.email,
            nome: data.nome,
            ruolo: data.ruolo,
            profile_image: data.profile_image,
        };

        return { user: userToReturn, error: null };
    },

    async getAllUsers() {
        const { data, error } = await supabase
            .from("utenti")
            .select("id, nome, email, ruolo, profile_image, numero_telefono, data_nascita, descrizione, isBanned");
        if (error) throw error;
        return data;
    },

    async update(id, fields) {
        const { data, error } = await supabase
            .from("utenti")
            .update(fields)
            .eq("id", id)
            .single();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    },
};

module.exports = userModel;
