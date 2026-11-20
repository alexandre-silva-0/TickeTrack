import jwt from "jsonwebtoken";

export const generateToken = (userId: number, role: string): string => {
    const secret = process.env.JWT_SECRET

    if (!secret) {
        throw new Error("A variável de ambiente JWT_SECRET não está definida")
    }

    return jwt.sign({ id: userId, role }, secret, {
        expiresIn: '1d'
    })
}
