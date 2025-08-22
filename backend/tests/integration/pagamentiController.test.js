const request = require("supertest");
const express = require("express");
const pagamentiController = require("../../controllers/pagamentiController");

jest.mock("../../models/pagamentiModel");
jest.mock("../../config/database");

const pagamentiModel = require("../../models/pagamentiModel");
const supabase = require("../../config/database");

// middleware finto per simulare autenticazione
function mockAuth(user) {
    return (req, res, next) => {
        req.user = user || { id: 1, ruolo: "utente" };
        next();
    };
}

const app = express();
app.use(express.json());
app.post("/api/pagamenti/conferma", mockAuth({ id: 1, ruolo: "utente" }), pagamentiController.confermaPagamento);
app.get("/api/pagamenti/storico", mockAuth({ id: 1, ruolo: "utente" }), pagamentiController.storicoPagamenti);

describe("Pagamenti Controller", () => {
    afterEach(() => jest.clearAllMocks());

    describe("POST /api/pagamenti/conferma", () => {
        it("400 se mancano parametri obbligatori", async () => {
            const res = await request(app).post("/api/pagamenti/conferma").send({});
            expect(res.statusCode).toBe(400);
        });

        it("404 se prenotazione non trovata", async () => {
            pagamentiModel.getPrenotazioneById.mockResolvedValueOnce(null);

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta"
            });

            expect(res.statusCode).toBe(404);
        });

        it("403 se utente non è owner né staff", async () => {
            pagamentiModel.getPrenotazioneById.mockResolvedValueOnce({ id: 123, id_utente: 99, stato: "attiva", importo: 100 });

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta"
            });

            expect(res.statusCode).toBe(403);
        });

        it("400 se prenotazione annullata", async () => {
            pagamentiModel.getPrenotazioneById.mockResolvedValueOnce({ id: 123, id_utente: 1, stato: "annullato", importo: 100 });

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta"
            });

            expect(res.statusCode).toBe(400);
        });

        it("200 se prenotazione già pagata", async () => {
            pagamentiModel.getPrenotazioneById.mockResolvedValueOnce({ id: 123, id_utente: 1, stato: "pagato", importo: 100 });
            pagamentiModel.getPagamentoByPrenotazione.mockResolvedValueOnce({ id: 77, id_prenotazione: 123 });

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta"
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Già pagata");
        });

        it("200 se transazione già registrata", async () => {
            pagamentiModel.getPrenotazioneById.mockResolvedValueOnce({ id: 123, id_utente: 1, stato: "attiva", importo: 100 });
            pagamentiModel.getPagamentoByTransazione.mockResolvedValueOnce({ id: 55, id_prenotazione: 123 });
            pagamentiModel.aggiornaPrenotazionePagata.mockResolvedValueOnce({ id: 123, stato: "pagato" });

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta",
                transazione_id: "abc123"
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Pagamento già registrato");
        });

        it("400 se importo insufficiente", async () => {
            pagamentiModel.getPrenotazioneById.mockResolvedValueOnce({ id: 123, id_utente: 1, stato: "attiva", importo: 200 });

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta"
            });

            expect(res.statusCode).toBe(400);
        });

        it("200 se pagamento creato correttamente", async () => {
            const pren = { id: 123, id_utente: 1, stato: "attiva", importo: 100 };
            const pagamento = { id: 1, id_prenotazione: 123, importo: 100 };

            pagamentiModel.getPrenotazioneById.mockResolvedValueOnce(pren);
            pagamentiModel.getPagamentoByTransazione.mockResolvedValueOnce(null);
            pagamentiModel.inserisciPagamento.mockResolvedValueOnce(pagamento);
            pagamentiModel.aggiornaPrenotazionePagata.mockResolvedValueOnce({ ...pren, stato: "pagato" });

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta"
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.pagamento.id).toBe(1);
            expect(res.body.prenotazione.stato).toBe("pagato");
        });

        it("500 se modello lancia errore", async () => {
            pagamentiModel.getPrenotazioneById.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).post("/api/pagamenti/conferma").send({
                id_prenotazione: 123,
                importo: 100,
                metodo: "carta"
            });

            expect(res.statusCode).toBe(500);
        });
    });

    describe("GET /api/pagamenti/storico", () => {
        it("200 con storico pagamenti", async () => {
            pagamentiModel.getStoricoPagamentiUtente.mockResolvedValueOnce([{ id: 1, importo: 100 }]);

            const res = await request(app).get("/api/pagamenti/storico");
            expect(res.statusCode).toBe(200);
            expect(res.body[0].importo).toBe(100);
        });

        it("500 se modello lancia errore", async () => {
            pagamentiModel.getStoricoPagamentiUtente.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).get("/api/pagamenti/storico");
            expect(res.statusCode).toBe(500);
        });
    });
});