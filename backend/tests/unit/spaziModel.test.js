// Mock del client Supabase
jest.mock("../../config/database");
const supabase = require("../../config/database");

const spaziModel = require("../../models/spaziModel");

describe("spaziModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("listBySede", () => {
        it("should return spazi attivi when no idSede is given", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [{ id: 1, attivo: true }],
                    error: null,
                }),
            });

            const result = await spaziModel.listBySede();
            expect(supabase.from).toHaveBeenCalledWith("spazi");
            expect(result).toEqual([{ id: 1, attivo: true }]);
        });

        it("should filter by idSede when provided", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [{ id: 2, id_sede: 5 }],
                    error: null,
                }),
            });

            const result = await spaziModel.listBySede(5);
            expect(result).toEqual([{ id: 2, id_sede: 5 }]);
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("db fail"),
                }),
            });

            await expect(spaziModel.listBySede()).rejects.toThrow("db fail");
        });
    });

    describe("createSpazio", () => {
        it("should insert spazio and return it", async () => {
            const mock = { id: 1, nome: "Sala Riunioni" };
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mock, error: null }),
            });

            const result = await spaziModel.createSpazio({
                id_sede: 1,
                nome: "Sala Riunioni",
                tipologia: "ufficio",
                prezzo_orario: 15,
            });
            expect(result).toEqual(mock);
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("insert fail"),
                }),
            });

            await expect(spaziModel.createSpazio({})).rejects.toThrow("insert fail");
        });
    });

    describe("updateSpazio", () => {
        it("should update spazio and return updated data", async () => {
            const mock = { id: 1, nome: "Updated" };
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mock, error: null }),
            });

            const result = await spaziModel.updateSpazio(1, { nome: "Updated" });
            expect(result.nome).toBe("Updated");
        });
    });

    describe("softDeleteSpazio", () => {
        it("should set attivo=false", async () => {
            const mock = { id: 1, attivo: false };
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mock, error: null }),
            });

            const result = await spaziModel.softDeleteSpazio(1);
            expect(result.attivo).toBe(false);
        });
    });

    describe("softActiveSpazio", () => {
        it("should set attivo=true", async () => {
            const mock = { id: 1, attivo: true };
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mock, error: null }),
            });

            const result = await spaziModel.softActiveSpazio(1);
            expect(result.attivo).toBe(true);
        });
    });

    describe("setServizi", () => {
        it("should delete old servizi and insert new ones", async () => {
            const mockRows = [
                { id_spazio: 1, id_servizio: 10 },
                { id_spazio: 1, id_servizio: 20 },
            ];

            supabase.from.mockImplementation((table) => {
                if (table === "spazi_servizi") {
                    return {
                        delete: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockResolvedValue({ error: null }),
                        insert: jest.fn().mockReturnThis(),
                        select: jest.fn().mockResolvedValue({ data: mockRows, error: null }),
                    };
                }
                return {};
            });

            const result = await spaziModel.setServizi(1, [10, 20]);
            expect(result).toEqual(mockRows);
        });

        it("should return [] if no serviziIds provided", async () => {
            supabase.from.mockReturnValue({
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await spaziModel.setServizi(1, []);
            expect(result).toEqual([]);
        });

        it("should throw if delete fails", async () => {
            supabase.from.mockReturnValue({
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: new Error("delete fail") }),
            });

            await expect(spaziModel.setServizi(1, [10])).rejects.toThrow("delete fail");
        });
    });
});
