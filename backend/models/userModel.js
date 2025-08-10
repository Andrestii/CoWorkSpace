const supabase = require("../config/database");
const {
    getUserCount,
    getAllUsers,
} = require("../controllers/userController");

/**
 * User model functions for interacting with the users table in Supabase
 */
const userModel = {
    /**
     * Get a user by their ID
     */
    async getUserById(id) {
        const { data, error } = await supabase
            .from("utenti")
            .select("*")
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
        const { data, error } = await supabase
            .from("utenti")
            .insert([
                {
                    nome: userData.nome,
                    email: userData.email,
                    password: userData.password,
                    ruolo: userData.ruolo,
                    profile_image: userData.profile_image || null,
                    numero_telefono: userData.numero_telefono || null,
                    data_nascita: userData.data_nascita || null,
                    descrizione: userData.descrizione || null,
                },
            ])
            .select();

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
            .eq("id", userId);

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

        // Delete the user authentication
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
        // Get user from utenti table
        const { data, error } = await supabase
            .from("utenti")
            .select(
                `
          *
        `
            )
            .eq("email", email)
            .single();

        if (error) throw error;

        // If no user found or password doesn't match
        if (!data || data.password !== password) {
            return { error: "Invalid email or password" };
        }

        // Generate a simple session token (in a real app, use JWT)

        const userToReturn = {
            id: data.id,
            email: data.email,
            nome: data.nome,
            ruolo: data.ruolo,
            profile_image: data.profile_image,
        };

        return {
            user: userToReturn,
            // Non è necessario restituire una sessione fittizia se usi JWT
            error: null, // Indica successo
        };
    },


    async getAllUsers() {
        const { data, error } = await supabase.from("utenti").select(
            `
        *
      `
        );

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
