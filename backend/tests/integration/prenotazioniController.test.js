const request = require("supertest");
const express = require("express");
const prenotazioniController = require("../../controllers/prenotazioniController");

jest.mock("../../models/prenotazioniModel");
jest.mock("../../config/database");

const prenotazioniModel = require("../../models/prenotazioniModel");
const supabase = require("../../config/database");

// Middleware finto per simulare autenticazione
function mockAuth(user) {
    return (req, res, next) => {
        req.user = user || { id: 1, ruolo: "utente" };
        next();
    };
}

const app = express();
app.use(express.json());
app.post("/api/prenotazioni", mockAuth({ id: 1, ruolo: "utente" }), prenotazioniController.createPrenotazione);
app.get("/api/prenotazioni/utente", mockAuth({ id: 1, ruolo: "utente" }), prenotazioniController.getPrenotazioniUtente);
app.patch("/api/prenotazioni/:id/stato", mockAuth({ id: 1, ruolo: "utente" }), prenotazioniController.updateStatoPrenotazione);
app.get("/api/prenotazioni/spazio/:id", mockAuth({ id: 1, ruolo: "utente" }), prenotazioniController.getPrenotazioniSpazio);

describe("Prenotazioni Controller", () => {
    afterEach(() => jest.clearAllMocks());

    describe("POST /api/prenotazioni", () => {
        it("400 se mancano parametri obbligatori", async () => {
            const res = await request(app).post("/api/prenotazioni").send({});
            expect(res.statusCode).toBe(400);
        });

        it("201 se prenotazione creata correttamente", async () => {
            const prenotazioneMock = { id: 1, id_spazio: 3, data: "2025-08-12", ora_inizio: "09:00", ora_fine: "11:00" };
            prenotazioniModel.createPrenotazione.mockResolvedValueOnce(prenotazioneMock);

            const res = await request(app).post("/api/prenotazioni").send({
                id_spazio: 3,
                data: "2025-08-12",
                ora_inizio: "09:00",
                ora_fine: "11:00",
                importo: 100
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.prenotazione).toEqual(prenotazioneMock);
        });

        it("500 se modello lancia errore", async () => {
            prenotazioniModel.createPrenotazione.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).post("/api/prenotazioni").send({
                id_spazio: 3,
                data: "2025-08-12",
                ora_inizio: "09:00",
                ora_fine: "11:00",
                importo: 100
            });

            expect(res.statusCode).toBe(500);
        });
    });

    describe("GET /api/prenotazioni/utente", () => {
        it("200 con prenotazioni utente", async () => {
            prenotazioniModel.listByUtente.mockResolvedValueOnce([{ id: 1, data: "2025-08-12" }]);

            const res = await request(app).get("/api/prenotazioni/utente");
            expect(res.statusCode).toBe(200);
            expect(res.body[0].id).toBe(1);
        });

        it("401 se utente non autenticato", async () => {
            // Creiamo un'app temporanea senza auth per testare il 401
            const tempApp = express();
            tempApp.use(express.json());
            tempApp.get("/api/prenotazioni/utente", prenotazioniController.getPrenotazioniUtente);

            const res = await request(tempApp).get("/api/prenotazioni/utente");
            expect(res.statusCode).toBe(401);
        });

        it("500 se modello lancia errore", async () => {
            prenotazioniModel.listByUtente.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).get("/api/prenotazioni/utente");
            expect(res.statusCode).toBe(500);
        });
    });

    describe("PATCH /api/prenotazioni/:id/stato", () => {
        it("400 se id o stato non validi", async () => {
            const res1 = await request(app).patch("/api/prenotazioni/abc/stato").send({ stato: "pagato" });
            expect(res1.statusCode).toBe(400);

            const res2 = await request(app).patch("/api/prenotazioni/1/stato").send({ stato: "sconosciuto" });
            expect(res2.statusCode).toBe(400);
        });

        it("200 se stato aggiornato correttamente", async () => {
            const prenMock = { id: 1, stato: "pagato" };
            prenotazioniModel.updateStato.mockResolvedValueOnce(prenMock);

            const res = await request(app).patch("/api/prenotazioni/1/stato").send({ stato: "pagato" });
            expect(res.statusCode).toBe(200);
            expect(res.body.prenotazione).toEqual(prenMock);
        });

        it("500 se modello lancia errore", async () => {
            prenotazioniModel.updateStato.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).patch("/api/prenotazioni/1/stato").send({ stato: "pagato" });
            expect(res.statusCode).toBe(500);
        });
    });

    describe("GET /api/prenotazioni/spazio/:id", () => {
        it("400 se id spazio non valido", async () => {
            const res = await request(app).get("/api/prenotazioni/spazio/abc");
            expect(res.statusCode).toBe(400);
        });

        it("200 con prenotazioni dello spazio", async () => {
            prenotazioniModel.listBySpazio.mockResolvedValueOnce([{ id: 1, id_spazio: 3 }]);

            const res = await request(app).get("/api/prenotazioni/spazio/3");
            expect(res.statusCode).toBe(200);
            expect(res.body[0].id_spazio).toBe(3);
        });

        it("500 se modello lancia errore", async () => {
            prenotazioniModel.listBySpazio.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).get("/api/prenotazioni/spazio/3");
            expect(res.statusCode).toBe(500);
        });
    });
});