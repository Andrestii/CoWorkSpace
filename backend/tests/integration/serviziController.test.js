const request = require("supertest");
const express = require("express");
const serviziController = require("../../controllers/serviziController");

// Mock model e supabase
jest.mock("../../models/serviziModel");
jest.mock("../../config/database");

const serviziModel = require("../../models/serviziModel");
const supabase = require("../../config/database");

// App Express fittizia
const app = express();
app.use(express.json());
app.get("/servizi", serviziController.getServizi);
app.post("/servizi", serviziController.createServizio);
app.delete("/servizi/:id", serviziController.deleteServizio);

describe("Servizi Controller Integration Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeAll(() => {
        // Mock base supabase (anche se non usato direttamente qui)
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
    describe("GET /servizi", () => {
        it("should return 200 and list servizi", async () => {
            serviziModel.listByName.mockResolvedValueOnce([
                { id: 1, nome: "wifi" },
            ]);

            const res = await request(app).get("/servizi?nome=wifi");
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].nome).toBe("wifi");
        });

        it("should return 200 with empty list if no results", async () => {
            serviziModel.listByName.mockResolvedValueOnce([]);
            const res = await request(app).get("/servizi?nome=inesistente");
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("should return 500 on model error", async () => {
            serviziModel.listByName.mockRejectedValueOnce(new Error("DB error"));
            const res = await request(app).get("/servizi");
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });

    // ---- POST ----
    describe("POST /servizi", () => {
        it("should return 400 if 'nome' is missing", async () => {
            const res = await request(app).post("/servizi").send({});
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/obbligatorio/);
        });

        it("should return 400 if 'nome' is not valid", async () => {
            const res = await request(app).post("/servizi").send({ nome: "piscina" });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/Nome servizio non valido/);
        });

        it("should return 201 if servizio is created", async () => {
            serviziModel.createServizio.mockResolvedValueOnce({
                id: 1,
                nome: "wifi",
            });

            const res = await request(app).post("/servizi").send({ nome: "wifi" });
            expect(res.statusCode).toBe(201);
            expect(res.body.servizio).toHaveProperty("id");
        });

        it("should return 500 if model throws error", async () => {
            serviziModel.createServizio.mockRejectedValueOnce(new Error("DB fail"));

            const res = await request(app).post("/servizi").send({ nome: "wifi" });
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });

    // ---- DELETE ----
    describe("DELETE /servizi/:id", () => {
        it("should return 400 if id is invalid", async () => {
            const res = await request(app).delete("/servizi/abc");
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/ID non valido/);
        });

        it("should return 200 if servizio is soft-deleted", async () => {
            serviziModel.softDeleteServizio.mockResolvedValueOnce({ id: 1, nome: "wifi" });

            const res = await request(app).delete("/servizi/1");
            expect(res.statusCode).toBe(200);
            expect(res.body.servizio).toHaveProperty("id");
        });

        it("should return 500 if model fails", async () => {
            serviziModel.softDeleteServizio.mockRejectedValueOnce(new Error("DB error"));

            const res = await request(app).delete("/servizi/1");
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });
});