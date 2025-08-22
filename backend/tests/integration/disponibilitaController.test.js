const request = require("supertest");
const express = require("express");
const disponibilitaController = require("../../controllers/disponibilitaController");

// Mock del model e di Supabase
jest.mock("../../models/disponibilitaModel");
jest.mock("../../config/database");

const disponibilitaModel = require("../../models/disponibilitaModel");
const supabase = require("../../config/database");

// Crea app Express fittizia collegata al controller
const app = express();
app.use(express.json());
app.get("/disponibilita", disponibilitaController.list);
app.post("/disponibilita", disponibilitaController.create);
app.put("/disponibilita/:id", disponibilitaController.update);
app.delete("/disponibilita/:id", disponibilitaController.delete);
app.get("/disponibilita/range", disponibilitaController.listByRange);

describe("Disponibilità Controller Integration Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Mock base di Supabase (non usato direttamente qui ma serve per sicurezza)
    beforeAll(() => {
        supabase.from.mockReturnValue({
            select: jest.fn(() => ({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            })),
            insert: jest.fn(() => ({
                select: jest.fn().mockResolvedValue({ data: {}, error: null }),
            })),
            update: jest.fn(() => ({
                eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
            })),
            delete: jest.fn(() => ({
                eq: jest.fn().mockResolvedValue({ error: null }),
            })),
        });
    });

    // ---- GET ----
    describe("GET /disponibilita", () => {
        it("should return 400 if id_spazio is missing", async () => {
            const res = await request(app).get("/disponibilita");
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/id_spazio/);
        });

        it("should return data if model resolves", async () => {
            disponibilitaModel.getBySpazioAndRange.mockResolvedValueOnce([
                { id: 1, id_spazio: 3, start_at: "2025-08-12T09:00:00Z", end_at: "2025-08-12T11:00:00Z" },
            ]);

            const res = await request(app)
                .get("/disponibilita")
                .query({ id_spazio: 3, from: "2025-08-12T00:00:00Z", to: "2025-08-13T00:00:00Z" });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it("should return 500 on model error", async () => {
            disponibilitaModel.getBySpazioAndRange.mockRejectedValueOnce(new Error("DB fail"));

            const res = await request(app).get("/disponibilita?id_spazio=3");
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });

    // ---- POST ----
    describe("POST /disponibilita", () => {
        it("should return 400 if missing fields", async () => {
            const res = await request(app).post("/disponibilita").send({});
            expect(res.statusCode).toBe(400);
        });

        it("should return 201 if created", async () => {
            disponibilitaModel.hasOverlap.mockResolvedValueOnce(false);
            disponibilitaModel.create.mockResolvedValueOnce({
                id: 1, id_spazio: 3, start_at: "2025-08-12T09:00:00Z", end_at: "2025-08-12T11:00:00Z"
            });

            const res = await request(app).post("/disponibilita").send({
                id_spazio: 3,
                start_at: "2025-08-12T09:00:00Z",
                end_at: "2025-08-12T11:00:00Z",
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.disponibilita).toHaveProperty("id");
        });

        it("should return 409 if overlap", async () => {
            disponibilitaModel.hasOverlap.mockResolvedValueOnce(true);

            const res = await request(app).post("/disponibilita").send({
                id_spazio: 3,
                start_at: "2025-08-12T09:00:00Z",
                end_at: "2025-08-12T11:00:00Z",
            });

            expect(res.statusCode).toBe(409);
        });
    });

    // ---- PUT ----
    describe("PUT /disponibilita/:id", () => {
        it("should return 404 if not found", async () => {
            disponibilitaModel.getById.mockResolvedValueOnce(null);

            const res = await request(app).put("/disponibilita/99").send({});
            expect(res.statusCode).toBe(404);
        });

        it("should update and return 200", async () => {
            disponibilitaModel.getById.mockResolvedValueOnce({
                id: 1, id_spazio: 3, start_at: "2025-08-12T09:00:00Z", end_at: "2025-08-12T11:00:00Z", disponibile: true
            });
            disponibilitaModel.hasOverlap.mockResolvedValueOnce(false);
            disponibilitaModel.update.mockResolvedValueOnce({
                id: 1, note: "Aggiornata"
            });

            const res = await request(app).put("/disponibilita/1").send({ note: "Aggiornata" });
            expect(res.statusCode).toBe(200);
            expect(res.body.disponibilita.note).toBe("Aggiornata");
        });
    });

    // ---- DELETE ----
    describe("DELETE /disponibilita/:id", () => {
        it("should delete and return 200", async () => {
            disponibilitaModel.delete.mockResolvedValueOnce({ id: 1 });

            const res = await request(app).delete("/disponibilita/1");
            expect(res.statusCode).toBe(200);
        });

        it("should return 404 if not found", async () => {
            disponibilitaModel.delete.mockResolvedValueOnce(null);

            const res = await request(app).delete("/disponibilita/1");
            expect(res.statusCode).toBe(404);
        });
    });
});
