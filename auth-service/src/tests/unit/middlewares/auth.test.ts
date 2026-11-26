import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Response } from "express";

import { checkToken, checkAuthorization } from "../../../middlewares/auth.js";
import { generateToken } from "../../../utils/jwt.js";
import type { IAuthRequest } from "../../../dtos/auth.dto.js";

// Middlewares são funções (req, res, next): basta montar objetos falsos e chamar direto.
// Estes dois não usam o res, então um objeto vazio serve.
const res = {} as Response;

function makeRequest(data: Partial<IAuthRequest> = {}) {
    return { cookies: {}, ...data } as IAuthRequest;
}

describe("checkToken", () => {
    it("lança 401 quando não há cookie de autenticação", () => {
        const req = makeRequest();
        const next = vi.fn();

        // função síncrona que lança: o expect recebe uma função (() =>), não o resultado
        expect(() => checkToken(req, res, next as NextFunction)).toThrow(
            expect.objectContaining({ statusCode: 401, message: "Você não está autenticado. Faça login para continuar." })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("lança 401 quando o token é inválido", () => {
        const req = makeRequest({ cookies: { token: "token-adulterado" } });
        const next = vi.fn();

        expect(() => checkToken(req, res, next as NextFunction)).toThrow(
            expect.objectContaining({ statusCode: 401, message: "Sessão inválida ou expirada. Faça login novamente." })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("preenche req.user e chama o next quando o token é válido", () => {
        const req = makeRequest({ cookies: { token: generateToken(7, "agent") } });
        const next = vi.fn();

        checkToken(req, res, next as NextFunction);

        expect(req.user).toMatchObject({ id: 7, role: "agent" });
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(); // sem argumento: next(erro) significaria falha
    });
});

describe("checkAuthorization", () => {
    it("lança 401 quando não há usuário na requisição", () => {
        // Caminho que nenhuma rota alcança, porque o checkToken sempre roda antes
        const next = vi.fn();

        expect(() => checkAuthorization(makeRequest(), res, next as NextFunction)).toThrow(
            expect.objectContaining({ statusCode: 401 })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it.each(["customer", "agent", "supervisor"])("lança 403 para o papel %s", (role) => {
        const next = vi.fn();

        expect(() => checkAuthorization(makeRequest({ user: { id: 1, role } }), res, next as NextFunction)).toThrow(
            expect.objectContaining({ statusCode: 403, message: "Você não tem permissão para concluir esta ação." })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("chama o next para o admin", () => {
        const next = vi.fn();

        checkAuthorization(makeRequest({ user: { id: 1, role: "admin" } }), res, next as NextFunction);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });
});
