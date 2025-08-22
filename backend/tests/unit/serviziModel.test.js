// Mock del client Supabase
jest.mock("../../config/database");
const supabase = require("../../config/database");

const serviziModel = require("../../models/serviziModel");

describe("serviziModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("listByName", () => {
        it("should return all active servizi when no name is provided", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [{ id: 1, nome: "WiFi", attivo: true }],
                    error: null,
                }),
            });

            const result = await serviziModel.listByName();
            expect(supabase.from).toHaveBeenCalledWith("servizi");
            expect(result).toEqual([{ id: 1, nome: "WiFi", attivo: true }]);
        });

        it("should filter by name when provided", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: [{ id: 2, nome: "Stampante", attivo: true }],
                    error: null,
                }),
            });

            const result = await serviziModel.listByName("Stampante");
            expect(result).toEqual([{ id: 2, nome: "Stampante", attivo: true }]);
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

            await expect(serviziModel.listByName()).rejects.toThrow("db fail");
        });
    });

    describe("createServizio", () => {
        it("should insert servizio and return it", async () => {
            const mock = { id: 1, nome: "WiFi", attivo: true };
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mock, error: null }),
            });

            const result = await serviziModel.createServizio({ nome: "WiFi" });
            expect(supabase.from).toHaveBeenCalledWith("servizi");
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

            await expect(serviziModel.createServizio({ nome: "WiFi" })).rejects.toThrow("insert fail");
        });
    });

    describe("softDeleteServizio", () => {
        it("should update attivo=false and return servizio", async () => {
            const mock = { id: 1, nome: "WiFi", attivo: false };
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mock, error: null }),
            });

            const result = await serviziModel.softDeleteServizio(1);
            expect(result.attivo).toBe(false);
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("update fail"),
                }),
            });

            await expect(serviziModel.softDeleteServizio(1)).rejects.toThrow("update fail");
        });
    });
});
