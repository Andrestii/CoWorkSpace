jest.mock("../../config/database");
const supabase = require("../../config/database");
const disponibilitaModel = require("../../models/disponibilitaModel");

describe("disponibilitaModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getById", () => {
        it("should return data when found", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            });

            const result = await disponibilitaModel.getById(1);
            expect(supabase.from).toHaveBeenCalledWith("disponibilita");
            expect(result).toEqual({ id: 1 });
        });

        it("should throw error when supabase returns error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: new Error("db error") }),
            });

            await expect(disponibilitaModel.getById(1)).rejects.toThrow("db error");
        });
    });

    describe("create", () => {
        it("should insert and return data", async () => {
            const slot = { id_spazio: 1, start_at: "2025-08-12", end_at: "2025-08-13" };

            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: slot, error: null }),
            });

            const result = await disponibilitaModel.create(slot);
            expect(supabase.from).toHaveBeenCalledWith("disponibilita");
            expect(result).toEqual(slot);
        });

        it("should throw error on insert failure", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error("insert error") }),
            });

            await expect(disponibilitaModel.create({})).rejects.toThrow("insert error");
        });
    });

    describe("update", () => {
        it("should update and return data", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 1, note: "upd" }, error: null }),
            });

            const result = await disponibilitaModel.update(1, { note: "upd" });
            expect(result).toEqual({ id: 1, note: "upd" });
        });

        it("should throw error on update failure", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error("update error") }),
            });

            await expect(disponibilitaModel.update(1, {})).rejects.toThrow("update error");
        });
    });

    describe("hasOverlap", () => {
        it("should return true if overlapping slots exist", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: [
                        { id: 1, start_at: "2025-08-12T09:00:00Z", end_at: "2025-08-12T11:00:00Z" },
                    ],
                    error: null,
                }),
            });

            const result = await disponibilitaModel.hasOverlap({
                id_spazio: 1,
                start_at: "2025-08-12T10:00:00Z",
                end_at: "2025-08-12T12:00:00Z",
            });

            expect(result).toBe(true);
        });

        it("should return false if no overlap", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({
                    data: [
                        { id: 1, start_at: "2025-08-12T09:00:00Z", end_at: "2025-08-12T11:00:00Z" },
                    ],
                    error: null,
                }),
            });

            const result = await disponibilitaModel.hasOverlap({
                id_spazio: 1,
                start_at: "2025-08-12T11:00:00Z",
                end_at: "2025-08-12T12:00:00Z",
            });

            expect(result).toBe(false);
        });

        it("should throw error if supabase fails", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ data: null, error: new Error("overlap error") }),
            });

            await expect(disponibilitaModel.hasOverlap({
                id_spazio: 1, start_at: "a", end_at: "b"
            })).rejects.toThrow("overlap error");
        });
    });

    describe("delete", () => {
        it("should delete and return existing slot", async () => {
            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
                })
                .mockReturnValueOnce({
                    delete: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockResolvedValue({ error: null }),
                });

            const result = await disponibilitaModel.delete(1);
            expect(result).toEqual({ id: 1 });
        });

        it("should return null if not existing", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            });

            const result = await disponibilitaModel.delete(999);
            expect(result).toBeNull();
        });

        it("should throw error if supabase fails", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: new Error("select error") }),
            });

            await expect(disponibilitaModel.delete(1)).rejects.toThrow("select error");
        });
    });
});
