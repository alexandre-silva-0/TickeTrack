import { NextFunction, Response } from "express"
import { IAuthRequest } from "../dtos/auth.dto.js"
import jwt from 'jsonwebtoken'
import { AppError } from "../errors/AppError.js"
import { AUTH_COOKIE_NAME } from "../utils/cookie.js"

export const checkToken = (req: IAuthRequest, res: Response, next: NextFunction) => {

    const token = req.cookies[AUTH_COOKIE_NAME]

    if (!token) {
        throw new AppError("Você não está autenticado. Faça login para continuar.", 401)
    }

    try {
        const secret = process.env.JWT_SECRET as string
        req.user = jwt.verify(token, secret) as { id: number; role: string }

    } catch (error) {
        throw new AppError("Sessão inválida ou expirada. Faça login novamente.", 401)
    }

    next()
}

export const checkAuthorization = (req: IAuthRequest, res: Response, next: NextFunction) => {

    const user = req.user
    if (!user) {
        throw new AppError("Você não está autenticado. Faça login para continuar.", 401)
    }

    if (user.role !== 'admin') {
        throw new AppError("Você não tem permissão para concluir esta ação.", 403)
    }

    next()
}