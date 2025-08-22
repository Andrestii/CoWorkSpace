// Mock del client Supabase
jest.mock("../../config/database");
const supabase = require("../../config/database");

const userModel = require("../../models/userModel");

describe("userModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getUserById", () => {
        it("should return user by id", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            });

            const result = await userModel.getUserById(1);
            expect(result).toEqual({ id: 1 });
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ error: new Error("fail") }),
            });

            await expect(userModel.getUserById(1)).rejects.toThrow("fail");
        });
    });

    describe("getUserByEmail", () => {
        it("should return user by email", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { email: "a@b.it" }, error: null }),
            });

            const result = await userModel.getUserByEmail("a@b.it");
            expect(result).toEqual({ email: "a@b.it" });
        });
    });

    describe("createUser", () => {
        it("should insert user and return with session token", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue({
                    data: [{ id: 1, nome: "Test" }],
                    error: null,
                }),
            });

            const result = await userModel.createUser({
                nome: "Test",
                email: "a@b.it",
                password: "123",
                ruolo: "cliente",
            });

            expect(result.user).toEqual([{ id: 1, nome: "Test" }]);
            expect(result.session).toHaveProperty("access_token");
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue({ error: new Error("insert fail") }),
            });

            await expect(userModel.createUser({})).rejects.toThrow("insert fail");
        });
    });

    describe("updateUserProfile", () => {
        it("should update profile", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ data: { nome: "New" }, error: null }),
            });

            const result = await userModel.updateUserProfile(1, { nome: "New" });
            expect(result.nome).toBe("New");
        });
    });

    describe("deleteUser", () => {
        it("should delete user and return success", async () => {
            supabase.from.mockReturnValue({
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            });
            supabase.auth = {
                admin: { deleteUser: jest.fn().mockResolvedValue({ error: null }) },
            };

            const result = await userModel.deleteUser(1);
            expect(result.success).toBe(true);
        });

        it("should throw if auth delete fails", async () => {
            supabase.from.mockReturnValue({
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            });
            supabase.auth = {
                admin: { deleteUser: jest.fn().mockResolvedValue({ error: new Error("auth fail") }) },
            };

            await expect(userModel.deleteUser(1)).rejects.toThrow("auth fail");
        });
    });

    describe("getUserCount", () => {
        it("should return number of users", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockResolvedValue({ data: [{}, {}], error: null }),
            });

            const result = await userModel.getUserCount();
            expect(result).toBe(2);
        });
    });

    describe("loginUser", () => {
        it("should return error if password mismatch", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { email: "a@b.it", password: "secret" },
                    error: null,
                }),
            });

            const result = await userModel.loginUser("a@b.it", "wrong");
            expect(result.error).toMatch(/Invalid/);
        });

        it("should return user if login ok", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: 1, email: "a@b.it", nome: "Test", password: "123", ruolo: "cliente" },
                    error: null,
                }),
            });

            const result = await userModel.loginUser("a@b.it", "123");
            expect(result.user).toHaveProperty("email", "a@b.it");
        });
    });

    describe("getAllUsers", () => {
        it("should return all users", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
            });

            const result = await userModel.getAllUsers();
            expect(result).toEqual([{ id: 1 }]);
        });
    });

    describe("update", () => {
        it("should update user", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { nome: "Aggiornato" }, error: null }),
            });

            const result = await userModel.update(1, { nome: "Aggiornato" });
            expect(result.nome).toBe("Aggiornato");
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ error: new Error("update fail") }),
            });

            await expect(userModel.update(1, {})).rejects.toThrow("update fail");
        });
    });
});
