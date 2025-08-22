// Mock del client Supabase
jest.mock("../../config/database");
const supabase = require("../../config/database");

const sediModel = require("../../models/sediModel");

describe("sediModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllSediAttive", () => {
        it("should return active sedi", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ data: [{ id: 1, attiva: true }], error: null }),
            });

            const result = await sediModel.getAllSediAttive();
            expect(supabase.from).toHaveBeenCalledWith("sedi");
            expect(result).toEqual([{ id: 1, attiva: true }]);
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ data: null, error: new Error("db error") }),
            });

            await expect(sediModel.getAllSediAttive()).rejects.toThrow("db error");
        });
    });

    describe("getSedeById", () => {
        it("should return a sede by id", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            });

            const result = await sediModel.getSedeById(1);
            expect(result).toEqual({ id: 1 });
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error("err") }),
            });

            await expect(sediModel.getSedeById(1)).rejects.toThrow("err");
        });
    });

    describe("createSede", () => {
        it("should insert and return sede", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 5 }, error: null }),
            });

            const result = await sediModel.createSede({ nome: "Test" });
            expect(result).toEqual({ id: 5 });
        });
    });

    describe("addGestoreToSede", () => {
        it("should insert gestore_sede relation", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await sediModel.addGestoreToSede(1, 2);
            expect(result).toEqual({ id_utente: 1, id_sede: 2 });
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockResolvedValue({ error: new Error("fail") }),
            });

            await expect(sediModel.addGestoreToSede(1, 2)).rejects.toThrow("fail");
        });
    });

    describe("updateSede", () => {
        it("should update sede", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 1, nome: "Updated" }, error: null }),
            });

            const result = await sediModel.updateSede(1, { nome: "Updated" });
            expect(result.nome).toBe("Updated");
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error("update fail") }),
            });

            await expect(sediModel.updateSede(1, {})).rejects.toThrow("update fail");
        });
    });

    describe("disattivaSede", () => {
        it("should call updateSede with attiva=false", async () => {
            const spy = jest.spyOn(sediModel, "updateSede").mockResolvedValue({ id: 1, attiva: false });
            const result = await sediModel.disattivaSede(1);
            expect(spy).toHaveBeenCalledWith(1, { attiva: false });
            expect(result.attiva).toBe(false);
            spy.mockRestore();
        });
    });

    describe("attivaSede", () => {
        it("should call updateSede with attiva=true", async () => {
            const spy = jest.spyOn(sediModel, "updateSede").mockResolvedValue({ id: 1, attiva: true });
            const result = await sediModel.attivaSede(1);
            expect(spy).toHaveBeenCalledWith(1, { attiva: true });
            expect(result.attiva).toBe(true);
            spy.mockRestore();
        });
    });
});
