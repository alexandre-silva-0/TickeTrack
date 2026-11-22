// middlewares/errorHandler.ts
import { NextFunction, Request, Response } from "express"
import { AppError } from "../errors/AppError.js"
import { sendError } from "../utils/responses.js"

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
    // A resposta já começou a ser enviada: não dá para responder de novo
    if (res.headersSent) {
        next(err)
        return
    }

    // Erros que o seu código lançou de propósito
    if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details)
        return
    }

    // JSON mal formado no body da requisição
    if (err instanceof SyntaxError && 'body' in err) {
        sendError(res, 400, "JSON inválido no corpo da requisição.")
        return
    }

    // Qualquer outra coisa é inesperada: log completo, resposta genérica
    console.error(err)
    sendError(res, 500, "Erro interno do servidor.")
}

export function notFoundHandler(req: Request, _res: Response) {
    throw new AppError(`Rota ${req.method} ${req.originalUrl} não encontrada.`, 404)
}