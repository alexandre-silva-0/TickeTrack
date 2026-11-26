import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

import validate from "../../../middlewares/validate.js";
import { userLoginValidation } from "../../../validators/auth-validations.js";

// O validate só lê o resultado das validações que rodaram antes dele.
// Aqui as validações rodam "na mão" com chain.run(req), como o Express faria na rota.
async function runLoginValidation(body: object) {
    const req = { body } as Request;
    for (const chain of userLoginValidation) {
        await chain.run(req);
    }
    return req;
}

const res = {} as Response;

describe("validate", () => {
    it("chama o next quando não há erros de validação", async () => {
        const req = await runLoginValidation({ email: "ana@empresa.com", password: "123456" });
        const next = vi.fn();

        validate(req, res, next as NextFunction);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it("lança 422 com todas as mensagens em details quando há erros", async () => {
        const req = await runLoginValidation({});
        const next = vi.fn();

        expect(() => validate(req, res, next as NextFunction)).toThrow(
            expect.objectContaining({
                statusCode: 422,
                message: "Dados inválidos.",
                details: expect.arrayContaining(["O e-mail é obrigatório.", "Informe sua senha."]),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("inclui só os campos que falharam", async () => {
        const req = await runLoginValidation({ email: "email-invalido", password: "123456" });

        expect(() => validate(req, res, vi.fn() as NextFunction)).toThrow(
            expect.objectContaining({ details: ["Insira um e-mail válido."] })
        );
    });
});
