import { describe, it, expect } from "vitest";
import request from "supertest";

import { app } from "../../app.js";

describe("comportamento geral da API", () => {
    it("responde 404 em JSON para uma rota que não existe", async () => {
        const res = await request(app).get("/api/nao-existe");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Rota GET /api/nao-existe não encontrada." });
    });

    it("responde 400 quando o body tem JSON quebrado", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .set("Content-Type", "application/json")
            .send('{ "email": ');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "JSON inválido no corpo da requisição." });
    });
});
