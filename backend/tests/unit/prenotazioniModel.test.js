// Mock del client Supabase
jest.mock("../../config/database");
const supabase = require("../../config/database");

const prenotazioniModel = require("../../models/prenotazioniModel");

// helper per creare un mock con due .order() in chain:
// - la 1ª .order() restituisce l'oggetto query (per permettere chaining)
// - la 2ª .order() restituisce la Promise risolta con {data, error}
function makeDoubleOrderQuery(result) {
    const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn(), // configuriamo sotto le due chiamate
    };
    // prima .order() -> ritorna l'oggetto per il chaining
    query.order.mockImplementationOnce(() => query);
    // seconda .order() -> risolve con il risultato finale
    query.order.mockImplementationOnce(() => Promise.resolve(result));
    return query;
}

describe("PrenotazioniModel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createPrenotazione", () => {
        it("should insert prenotazione and return data", async () => {
            const mockPren = { id: 1, stato: "in_attesa" };

            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockPren, error: null }),
            });

            const result = await prenotazioniModel.createPrenotazione({
                id_utente: 1,
                id_spazio: 2,
                data: "2025-08-22",
                ora_inizio: "09:00:00",
                ora_fine: "11:00:00",
                importo: 50,
            });

            expect(supabase.from).toHaveBeenCalledWith("prenotazioni");
            expect(result).toEqual(mockPren);
        });

        it("should throw on supabase error", async () => {
            supabase.from.mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("insert error"),
                }),
            });

            await expect(
                prenotazioniModel.createPrenotazione({
                    id_utente: 1,
                    id_spazio: 2,
                    data: "2025-08-22",
                    ora_inizio: "09:00:00",
                    ora_fine: "11:00:00",
                })
            ).rejects.toThrow("insert error");
        });
    });

    describe("listByUtente", () => {
        it("should return prenotazioni of a user", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
            });

            const result = await prenotazioniModel.listByUtente(1);
            expect(supabase.from).toHaveBeenCalledWith("prenotazioni");
            expect(result).toEqual([{ id: 1 }]);
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("list error"),
                }),
            });

            await expect(prenotazioniModel.listByUtente(1)).rejects.toThrow("list error");
        });
    });

    describe("updateStato", () => {
        it("should update stato and return prenotazione", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: 1, stato: "pagato" },
                    error: null,
                }),
            });

            const result = await prenotazioniModel.updateStato(1, "pagato");
            expect(result.stato).toBe("pagato");
        });

        it("should throw on error", async () => {
            supabase.from.mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error("update error"),
                }),
            });

            await expect(prenotazioniModel.updateStato(1, "pagato")).rejects.toThrow(
                "update error"
            );
        });
    });

    describe("listBySpazio", () => {
        it("should return prenotazioni of a space", async () => {
            const final = { data: [{ id: 1, id_spazio: 2 }], error: null };
            const query = makeDoubleOrderQuery(final);

            supabase.from.mockReturnValue(query);

            const result = await prenotazioniModel.listBySpazio(2);
            expect(supabase.from).toHaveBeenCalledWith("prenotazioni");
            // prima order per "data", seconda per "ora_inizio"
            expect(query.order).toHaveBeenCalledTimes(2);
            expect(result).toEqual([{ id: 1, id_spazio: 2 }]);
        });

        it("should throw on error", async () => {
            const final = { data: null, error: new Error("list spazio error") };
            const query = makeDoubleOrderQuery(final);

            supabase.from.mockReturnValue(query);

            await expect(prenotazioniModel.listBySpazio(2)).rejects.toThrow("list spazio error");
            expect(query.order).toHaveBeenCalledTimes(2);
        });
    });
});
