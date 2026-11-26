import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

import { app } from "../../app.js";
import { getUserByEmail, getUserById, getAllUsers, updateUserRole } from "../../repositories/UserRepository.js";
import { publishMessage } from "../../config/rabbitmq.js";
import { authCookie } from "../helpers/auth.js";
import type { User } from "../../models/User.js";

// Banco e RabbitMQ simulados; o resto da aplicação é real
vi.mock("../../repositories/UserRepository.js");
vi.mock("../../config/rabbitmq.js");

// Como o getUserById devolve: sem o hash
const ana = { id: 1, name: "Ana", email: "ana@empresa.com", role: "agent" } as unknown as User;

const adminCookie = () => authCookie(10, "admin");
const customerCookie = () => authCookie(20, "customer");

beforeEach(() => {
    vi.resetAllMocks();
});

describe("GET /api/users/me", () => {
    it("responde 401 sem o cookie de autenticação", async () => {
        const res = await request(app).get("/api/users/me");

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Você não está autenticado. Faça login para continuar." });
    });

    it("responde 401 com um token inválido", async () => {
        const res = await request(app).get("/api/users/me").set("Cookie", "token=token-adulterado");

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Sessão inválida ou expirada. Faça login novamente." });
    });

    it("responde 200 com o usuário logado", async () => {
        vi.mocked(getUserById).mockResolvedValue(ana);

        const res = await request(app).get("/api/users/me").set("Cookie", authCookie(1, "agent"));

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({ id: 1, name: "Ana", email: "ana@empresa.com", role: "agent" });
        expect(getUserById).toHaveBeenCalledWith(1); // o id vem do token
    });
});

describe("GET /api/users", () => {
    it("responde 403 para quem não é admin", async () => {
        const res = await request(app).get("/api/users").set("Cookie", customerCookie());

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: "Você não tem permissão para concluir esta ação." });
        expect(getAllUsers).not.toHaveBeenCalled();
    });

    it("responde 200 com a lista para o admin", async () => {
        vi.mocked(getAllUsers).mockResolvedValue([ana]);

        const res = await request(app).get("/api/users").set("Cookie", adminCookie());

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([{ id: 1, name: "Ana", email: "ana@empresa.com", role: "agent" }]);
    });
});

describe("POST /api/users", () => {
    const body = {
        name: "Bruno",
        email: "bruno@empresa.com",
        role: "agent",
        password: "senha123",
        confirmPassword: "senha123",
    };

    it("responde 409 quando o e-mail já está cadastrado", async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(ana);

        const res = await request(app).post("/api/users").set("Cookie", adminCookie()).send(body);

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: "E-mail já cadastrado." });
        expect(publishMessage).not.toHaveBeenCalled();
    });

    it("responde 422 quando as senhas não conferem", async () => {
        const res = await request(app)
            .post("/api/users")
            .set("Cookie", adminCookie())
            .send({ ...body, confirmPassword: "outra-senha" });

        expect(res.status).toBe(422);
        expect(res.body.details).toContain("As senhas estão diferentes.");
        expect(getUserByEmail).not.toHaveBeenCalled();
    });

    it("responde 403 quando quem tenta criar não é admin", async () => {
        const res = await request(app).post("/api/users").set("Cookie", customerCookie()).send(body);

        expect(res.status).toBe(403);
        expect(getUserByEmail).not.toHaveBeenCalled();
    });
});

describe("PATCH /api/users/:id/role", () => {
    it("responde 404 quando o usuário não existe", async () => {
        vi.mocked(getUserById).mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/users/9999/role")
            .set("Cookie", adminCookie())
            .send({ role: "agent" });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Usuário não encontrado." });
        expect(updateUserRole).not.toHaveBeenCalled();
    });

    it("responde 422 quando o id não é um número", async () => {
        const res = await request(app)
            .patch("/api/users/abc/role")
            .set("Cookie", adminCookie())
            .send({ role: "agent" });

        expect(res.status).toBe(422);
        expect(res.body.details).toContain("Insira um id válido.");
        expect(getUserById).not.toHaveBeenCalled();
    });

    it("responde 200, atualiza e publica o evento quando tudo está certo", async () => {
        vi.mocked(getUserById).mockResolvedValue(ana);

        const res = await request(app)
            .patch("/api/users/1/role")
            .set("Cookie", adminCookie())
            .send({ role: "supervisor" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ msg: "Papel do usuário atualizado com sucesso." });
        expect(updateUserRole).toHaveBeenCalledWith({ id: 1, role: "supervisor" });
        expect(publishMessage).toHaveBeenCalledWith("user_role_updated", { id: 1, role: "supervisor" });
    });
});
