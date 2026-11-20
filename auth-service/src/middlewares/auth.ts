import { NextFunction, Response } from "express"
import { IAuthRequest } from "../dtos/auth.dto.js"
import jwt from 'jsonwebtoken'

export const checkToken = (req: IAuthRequest, res: Response, next: NextFunction) => {
    
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ error: "Você não está autenticado. Faça login para continuar." })
    }

    try {
        const secret = process.env.JWT_SECRET as string

        const decoded = jwt.verify(token, secret) as { id: number; role: string }

        req.user = decoded

        next()
    } catch (error) {
        return res.status(401).json({ error: "Token inválido ou expirado." })
    }
}

export const checkAuthorization = (req: IAuthRequest, res: Response, next: NextFunction) => {

    const user = req.user
    if (!user) return res.status(401).json({ error: "Você não está autenticado. Faça login para continuar." })

    if (user.role !== 'admin') return res.status(403).json({ error: 'Você não tem permissão para concluir esta ação.' })

    next()
}