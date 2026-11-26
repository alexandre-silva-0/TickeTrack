import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextFunction, Request, Response } from "express";

import { errorHandler, notFoundHandler } from "../../../middlewares/errorHandler.js";
import { AppError } from "../../../errors/AppError.js";

// O errorHandler usa o res de verdade (status e json), então o res falso precisa
// desses métodos. mockReturnThis() faz o status devolver o próprio res, como no Express,
// para o encadeamento res.status(...).json(...) funcionar.
function makeResponse(headersSent = false) {
    return {
        headersSent,
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

const req = {} as Request;

describe("errorHandler", () => {
    beforeEach(() => {
        // Silencia o console.error do caminho 500 e permite verificar se ele foi chamado
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks(); // devolve o console.error original
    });

    it("responde com o status e a mensagem de um AppError", () => {
        const res = makeResponse();
        const next = vi.fn();

        errorHandler(new AppError("E-mail já cadastrado.", 409), req, res, next as NextFunction);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: "E-mail já cadastrado." });
        expect(next).not.toHaveBeenCalled();
    });

    it("inclui os details quando o AppError tem detalhes", () => {
        const res = makeResponse();

        errorHandler(new AppError("Dados inválidos.", 422, ["Informe sua senha."]), req, res, vi.fn() as NextFunction);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({ error: "Dados inválidos.", details: ["Informe sua senha."] });
    });

    it("responde 400 para JSON mal formado no body", () => {
        const res = makeResponse();
        // Imita o erro que o express.json() lança: um SyntaxError com a propriedade body
        const err = Object.assign(new SyntaxError("Unexpected end of JSON input"), { body: '{ "email": ' });

        errorHandler(err, req, res, vi.fn() as NextFunction);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "JSON inválido no corpo da requisição." });
    });

    it("trata um SyntaxError sem body como erro interno (bug no código, não JSON do cliente)", () => {
        const res = makeResponse();

        errorHandler(new SyntaxError("JSON.parse falhou"), req, res, vi.fn() as NextFunction);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it("responde 500 genérico para erros inesperados, sem expor detalhes", () => {
        const res = makeResponse();
        const err = new Error("Connection refused: mysql://usuario:senha@192.168.1.150");

        errorHandler(err, req, res, vi.fn() as NextFunction);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Erro interno do servidor." });
        expect(console.error).toHaveBeenCalledWith(err); // o detalhe vai para o log, não para o cliente
    });

    it("repassa para o next quando a resposta já foi enviada", () => {
        const res = makeResponse(true);
        const next = vi.fn();
        const err = new Error("erro depois da resposta");

        errorHandler(err, req, res, next as NextFunction);

        expect(next).toHaveBeenCalledWith(err);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});

describe("notFoundHandler", () => {
    it("lança 404 com o método e a rota na mensagem", () => {
        const notFoundReq = { method: "GET", originalUrl: "/api/nao-existe" } as Request;

        expect(() => notFoundHandler(notFoundReq, {} as Response)).toThrow(
            expect.objectContaining({ statusCode: 404, message: "Rota GET /api/nao-existe não encontrada." })
        );
    });
});
