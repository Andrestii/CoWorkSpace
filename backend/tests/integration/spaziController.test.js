const request = require("supertest");
const express = require("express");
const spaziController = require("../../controllers/spaziController");

// Mock del model e di Supabase
jest.mock("../../models/spaziModel");
jest.mock("../../config/database");

const spaziModel = require("../../models/spaziModel");
const supabase = require("../../config/database");

// App Express fittizia
const app = express();
app.use(express.json());
app.get("/spazi", spaziController.getSpazi);
app.post("/spazi", spaziController.createSpazio);
app.put("/spazi/:id", spaziController.updateSpazio);
app.delete("/spazi/:id", spaziController.deleteSpazio);
app.put("/spazi/:id/attiva", spaziController.attivaSpazio);
app.post("/spazi/:id/servizi", spaziController.setServizi);

describe("Spazi Controller Integration Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeAll(() => {
        // Mock base Supabase storage
        supabase.storage = {
            from: jest.fn().mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: "http://mock-url/image.png" },
                }),
            }),
        };
    });

    // ---- GET ----
    describe("GET /spazi", () => {
        it("should return 200 and list spazi", async () => {
            spaziModel.listBySede.mockResolvedValueOnce([{ id: 1, nome: "Ufficio" }]);

            const res = await request(app).get("/spazi?sede=1");
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it("should return 500 on model error", async () => {
            spaziModel.listBySede.mockRejectedValueOnce(new Error("DB error"));
            const res = await request(app).get("/spazi?sede=1");
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });

    // ---- POST ----
    describe("POST /spazi", () => {
        it("should return 400 if missing fields", async () => {
            const res = await request(app).post("/spazi").send({});
            expect(res.statusCode).toBe(400);
        });

        it("should return 400 if tipologia non valida", async () => {
            const res = await request(app).post("/spazi").send({
                id_sede: 1,
                nome: "Sala test",
                tipologia: "piscina",
                prezzo_orario: 10,
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/tipologia non valida/);
        });

        it("should return 201 if spazio is created", async () => {
            spaziModel.createSpazio.mockResolvedValueOnce({ id: 1, nome: "Sala test" });

            const res = await request(app).post("/spazi").send({
                id_sede: 1,
                nome: "Sala test",
                tipologia: "ufficio",
                prezzo_orario: 20,
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.spazio).toHaveProperty("id");
        });

        it("should return 500 if model fails", async () => {
            spaziModel.createSpazio.mockRejectedValueOnce(new Error("DB fail"));

            const res = await request(app).post("/spazi").send({
                id_sede: 1,
                nome: "Sala test",
                tipologia: "ufficio",
                prezzo_orario: 20,
            });

            expect(res.statusCode).toBe(500);
        });
    });

    // ---- PUT ----
    describe("PUT /spazi/:id", () => {
        it("should return 400 if ID is invalid", async () => {
            const res = await request(app).put("/spazi/abc").send({});
            expect(res.statusCode).toBe(400);
        });

        it("should return 400 if tipologia non valida", async () => {
            const res = await request(app).put("/spazi/1").send({ tipologia: "piscina" });
            expect(res.statusCode).toBe(400);
        });

        it("should return 200 if spazio updated", async () => {
            spaziModel.updateSpazio.mockResolvedValueOnce({ id: 1, nome: "Aggiornato" });

            const res = await request(app).put("/spazi/1").send({ nome: "Aggiornato" });
            expect(res.statusCode).toBe(200);
            expect(res.body.spazio.nome).toBe("Aggiornato");
        });

        it("should return 500 if model fails", async () => {
            spaziModel.updateSpazio.mockRejectedValueOnce(new Error("DB fail"));

            const res = await request(app).put("/spazi/1").send({ nome: "Aggiornato" });
            expect(res.statusCode).toBe(500);
        });
    });

    // ---- DELETE ----
    describe("DELETE /spazi/:id", () => {
        it("should return 400 if ID is invalid", async () => {
            const res = await request(app).delete("/spazi/abc");
            expect(res.statusCode).toBe(400);
        });

        it("should return 200 if spazio deleted", async () => {
            spaziModel.softDeleteSpazio.mockResolvedValueOnce({ id: 1 });

            const res = await request(app).delete("/spazi/1");
            expect(res.statusCode).toBe(200);
        });

        it("should return 500 if model fails", async () => {
            spaziModel.softDeleteSpazio.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).delete("/spazi/1");
            expect(res.statusCode).toBe(500);
        });
    });

    // ---- ATTIVA ----
    describe("PUT /spazi/:id/attiva", () => {
        it("should return 400 if ID is invalid", async () => {
            const res = await request(app).put("/spazi/abc/attiva");
            expect(res.statusCode).toBe(400);
        });

        it("should return 200 if spazio attivato", async () => {
            spaziModel.softActiveSpazio.mockResolvedValueOnce({ id: 1, attivo: true });

            const res = await request(app).put("/spazi/1/attiva");
            expect(res.statusCode).toBe(200);
            expect(res.body.spazio).toHaveProperty("attivo", true);
        });

        it("should return 500 if model fails", async () => {
            spaziModel.softActiveSpazio.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).put("/spazi/1/attiva");
            expect(res.statusCode).toBe(500);
        });
    });

    // ---- SET SERVIZI ----
    describe("POST /spazi/:id/servizi", () => {
        it("should return 400 if ID invalid", async () => {
            const res = await request(app).post("/spazi/abc/servizi").send({ servizi: [1, 2] });
            expect(res.statusCode).toBe(400);
        });

        it("should return 200 if servizi set", async () => {
            spaziModel.setServizi.mockResolvedValueOnce([{ spazio_id: 1, servizio_id: 2 }]);

            const res = await request(app).post("/spazi/1/servizi").send({ servizi: [2] });
            expect(res.statusCode).toBe(200);
            expect(res.body.collegamenti).toHaveLength(1);
        });

        it("should return 500 if model fails", async () => {
            spaziModel.setServizi.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).post("/spazi/1/servizi").send({ servizi: [2] });
            expect(res.statusCode).toBe(500);
        });
    });
});