import { ICreateUserBody, IUpdateUserRole } from "../dtos/auth.dto.js"
import { AppError } from "../errors/AppError.js"
import { createUser, getUserByEmail, getUserById, updateUserRole } from "../repositories/UserRepository.js"
import { createHashedPassword } from "../utils/bcrypt.js"
import { publishMessage } from "../config/rabbitmq.js"
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
    if (!user) {
        throw new AppError("Usuário não encontrado.", 404)
    }

    await updateUserRole({ id: data.id, role: data.role })

    await publishMessage('user_role_updated', { id: data.id, role: data.role })

    return { user }
}