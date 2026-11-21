//helpers
import { checkPassword, createHashedPassword } from "../utils/bcrypt.js"
import { generateToken } from "../utils/jwt.js"

//repositories
import { createUser, getUserByEmail, getUserById, updateUserRole } from "../repositories/UserRepository.js"

//RabbitMQ
import { publishMessage } from "../config/rabbitmq.js"

//types
import { User } from "../models/User.js"
import { ICreateUserBody, IUpdateUserRole } from "../dtos/auth.dto.js"
import { AppError } from "../errors/AppError.js"

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

export async function createNewUser(data: ICreateUserBody) {
    const { name, email, password, role } = data

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
        throw new AppError("E-mail já cadastrado.", 409)
    }

    const hashedPassword = createHashedPassword(password)

    const createdUser = await createUser({
        name,
        email,
        hashedPassword,
        role
    })

    const publicUser = toPublicUser(createdUser)

    await publishMessage('user_created', publicUser)

    return { user: publicUser }
}

export async function updateRole(data: IUpdateUserRole) {
    const user = await getUserById(Number(data.id))
    if (!user) return null

    await updateUserRole({ id: Number(data.id), role: data.role })

    await publishMessage('updated_user', { data })
}