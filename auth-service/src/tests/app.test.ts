import { describe, it, expect } from "vitest";
import request from 'supertest'
import { app } from "../index.js";

describe("Rotas desconhecidas", () => {
    it("Responde 404 em JSON", async () => {
        const res = await request(app).get("/api/nao-existe")

        expect(res.status).toBe(404)
        expect(res.body.error).toContain('não encontrada')
    })
})

// describe('E-mail não cadastrado', () => {
//     it("Responde 401", async () => {
//         const res = await request(app).post()
//     })
// })