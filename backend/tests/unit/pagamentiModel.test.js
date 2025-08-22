// Mock del client Supabase
jest.mock("../../config/database");
const supabase = require("../../config/database");

const pagamentiModel = require("../../models/pagamentiModel");
// ⚠️ rinomina il file in models/pagamentiModel.js se non lo è già

describe("pagamentiModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getPrenotazioneById", () => {
        it("should return prenotazione data", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            });

            const result = await pagamentiModel.getPrenotazioneById(1);
            expect(supabase.from).toHaveBeenCalledWith("prenotazioni");
            expect(result).toEqual({ id: 1 });
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error("db error") }),
            });

            await expect(pagamentiModel.getPrenotazioneById(1)).rejects.toThrow("db error");
        });
    });

    describe("getPagamentoByTransazione", () => {
        it("should return null if no id", async () => {
            const result = await pagamentiModel.getPagamentoByTransazione(null);
            expect(result).toBeNull();
        });

        it("should return pagamento by transazione", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
            });

            const result = await pagamentiModel.getPagamentoByTransazione("tx123");
            expect(supabase.from).toHaveBeenCalledWith("pagamenti");
            expect(result).toEqual({ id: 1 });
        });
    });

    describe("getPagamentoByPrenotazione", () => {
        it("should return pagamento", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 99 }, error: null }),
            });

            const result = await pagamentiModel.getPagamentoByPrenotazione(99);
            expect(result).toEqual({ id: 99 });
        });
    });

    describe("inserisciPagamento", () => {
        it("should insert and return data", async () => {
            const newPay = { id_prenotazione: 1, id_utente: 2, importo: 100, metodo: "paypal", transazione_id: "tx1" };

            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { ...newPay, id: 10 }, error: null }),
            });

            const result = await pagamentiModel.inserisciPagamento(newPay);
            expect(supabase.from).toHaveBeenCalledWith("pagamenti");
            expect(result.id).toBe(10);
        });

        it("should throw error if insert fails", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error("insert fail") }),
            });

            await expect(
                pagamentiModel.inserisciPagamento({ id_prenotazione: 1, id_utente: 2 })
            ).rejects.toThrow("insert fail");
        });
    });

    describe("aggiornaPrenotazionePagata", () => {
        it("should update prenotazione to pagato", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: 1, stato: "pagato" },
                    error: null,
                }),
            });

            const result = await pagamentiModel.aggiornaPrenotazionePagata(1, "tx999");
            expect(result.stato).toBe("pagato");
        });
    });

    describe("getStoricoPagamentiUtente", () => {
        it("should return list of pagamenti", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockResolvedValue({
                    data: [{ id: 1, id_utente: 1, importo: 100 }],
                    error: null,
                }),
            });

            const result = await pagamentiModel.getStoricoPagamentiUtente({
                userId: 1,
                from: "2025-01-01",
                to: "2025-12-31",
                limit: 10,
                offset: 0,
            });

            expect(supabase.from).toHaveBeenCalledWith("pagamenti");
            expect(result).toHaveLength(1);
        });

        it("should throw on supabase error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("storico error"),
                }),
            });

            await expect(
                pagamentiModel.getStoricoPagamentiUtente({ userId: 1, from: "a", to: "b" })
            ).rejects.toThrow("storico error");
        });
    });
});
