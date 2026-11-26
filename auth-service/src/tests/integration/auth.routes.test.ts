import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

import { app } from "../../app.js";
import { getUserByEmail } from "../../repositories/UserRepository.js";
import { createHashedPassword } from "../../utils/bcrypt.js";
import type { User } from "../../models/User.js";

// Só o banco é simulado. Rotas, validação, controllers, services, bcrypt, JWT e cookie são reais.
vi.mock("../../repositories/UserRepository.js");

// Hash gerado com o bcrypt de verdade, para o login comparar a senha de verdade
const storedUser = {
    id: 1,
    name: "Ana",
    email: "ana@empresa.com",
    role: "agent",
    hashedPassword: createHashedPassword("senha-certa"),
} as unknown as User;

beforeEach(() => {
    vi.resetAllMocks();
});

describe("POST /api/auth/login", () => {
    it("responde 200, devolve o usuário e cria o cookie quando as credenciais estão certas", async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(storedUser);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "ana@empresa.com", password: "senha-certa" });

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({ id: 1, name: "Ana", email: "ana@empresa.com", role: "agent" });
        expect(res.body.data).not.toHaveProperty("hashedPassword");

        const cookie = String(res.headers["set-cookie"]);
        expect(cookie).toMatch(/^token=.+/);
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("SameSite=Strict");
    });

    it("responde 401 quando a senha está errada", async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(storedUser);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "ana@empresa.com", password: "senha-errada" });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "E-mail ou senha incorretos." });
        expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("responde 401 com a mesma mensagem quando o e-mail não existe", async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "ninguem@empresa.com", password: "qualquer-senha" });

        // Mesmo status e mesma mensagem da senha errada: não dá para descobrir quais e-mails existem
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "E-mail ou senha incorretos." });
    });

    it("responde 422 com os detalhes quando o body vem vazio", async () => {
        const res = await request(app).post("/api/auth/login").send({});

        expect(res.status).toBe(422);
        expect(res.body.error).toBe("Dados inválidos.");
        expect(res.body.details).toEqual(
            expect.arrayContaining(["O e-mail é obrigatório.", "Informe sua senha."])
        );
        expect(getUserByEmail).not.toHaveBeenCalled();
    });
});

describe("POST /api/auth/logout", () => {
    it("responde 204 sem corpo e remove o cookie", async () => {
        const res = await request(app).post("/api/auth/logout");

        expect(res.status).toBe(204);
        expect(res.text).toBe("");

        const cookie = String(res.headers["set-cookie"]);
        expect(cookie).toMatch(/^token=;/);
        expect(cookie).toContain("Expires=Thu, 01 Jan 1970");
    });
});
