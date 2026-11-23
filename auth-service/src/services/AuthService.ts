//helpers
import { checkPassword, createHashedPassword } from "../utils/bcrypt.js"
import { generateToken } from "../utils/jwt.js"

//repositories
import { createUser, getUserByEmail, getUserById, updateUserRole } from "../repositories/UserRepository.js"

//RabbitMQ
import { publishMessage } from "../config/rabbitmq.js"

//types
import { User } from "../models/User.js"

// O que pode sair do serviço sobre um usuário. Nunca o hash da senha.
function toPublicUser(user: User) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }
}

export async function authenticate(email: string, password: string) {
    const user = await getUserByEmail(email)
    if (!user) return null

    const isValidPassword = checkPassword(password, user.hashedPassword)
    if (!isValidPassword) return null

    const token = generateToken(user.id, user.role)

    return { user: toPublicUser(user), token }
}

