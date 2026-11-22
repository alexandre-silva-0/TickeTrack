// controllers/UserController.ts
import { Request, Response } from "express";

//utils
import { clearCookie, createCookie } from "../utils/cookie.js";
import { sendSuccess } from "../utils/responses.js";

//repositories
import { getUserById, getAllUsers } from "../repositories/UserRepository.js";

//interfaces
import { IAuthRequest, ICreateUserBody, ILoginBody } from "../dtos/auth.dto.js";

//RabbitMQ
import { publishMessage } from "../config/rabbitmq.js";

//services
import { authenticate } from "../services/AuthService.js";
import { createNewUser, updateRole } from "../services/UserService.js";

//errors
import { AppError } from "../errors/AppError.js";

export async function createUserByAdmin(req: Request<{}, {}, ICreateUserBody>, res: Response) {
    const { user } = await createNewUser(req.body)
    sendSuccess(res, { status: 201, data: user, msg: 'Usuário criado com sucesso.' })
}

export async function login(req: Request<{}, {}, ILoginBody>, res: Response) {
    const { email, password } = req.body

    const result = await authenticate(email, password)
    if (!result) {
        throw new AppError("E-mail ou senha incorretos.", 401)
    }

    createCookie(res, result.token)
    sendSuccess(res, { data: result.user, msg: "Login realizado com sucesso." })
}

export function logout(_req: Request, res: Response) {
    clearCookie(res)
    sendSuccess(res, { status: 204 })
}

export async function currentuser(req: IAuthRequest, res: Response) {
    const user = await getUserById(req.user!.id)
    if (!user) {
        throw new AppError("Usuário não encontrado.", 404)
    }

    sendSuccess(res, { data: user })
}

export async function allUsers(_req: Request, res: Response) {
    const users = await getAllUsers()
    sendSuccess(res, { data: users })
}

export async function changeRole(req: IAuthRequest, res: Response) {
    const id = Number(req.params.id)
    const { role } = req.body

    await updateRole({ id, role })
    sendSuccess(res, { msg: "Papel do usuário atualizado com sucesso." })
}

export async function syncAllUsers(_req: Request, res: Response) {
    const users = await getAllUsers()

    for (const user of users) {
        await publishMessage('user_created', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        })
    }

    sendSuccess(res, { msg: "Usuários sincronizados." })
}