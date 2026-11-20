//packages
import { Request, Response } from "express";

//helpers
import { clearCookie, createCookie } from "../utils/cookie.js";

//repositories
import { getUserById, getAllUsers, updateUserRole } from "../repositories/UserRepository.js";

//interfaces
import { IAuthRequest, ICreateUserBody } from "../dtos/auth.dto.js";
import { ILoginBody } from "../dtos/auth.dto.js";

//RabbitMQ
import { publishMessage } from "../config/rabbitmq.js";

//services
import { authenticate, createNewUser } from "../services/AuthService.js";
import { AppError } from "../errors/AppError.js";

export async function createUserByAdmin(req: Request<{}, {}, ICreateUserBody>, res: Response) {
    try {
        const { user } = await createNewUser(req.body)

        res.status(201).json({ msg: 'Usuário criado com sucesso.', data: user })
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message })
            return
        }

        console.error(error)
        res.status(500).json({ error: "Não foi possível criar usuário." })
    }
}

export async function login(req: Request<{}, {}, ILoginBody>, res: Response) {
    const { email, password } = req.body

    try {
        const result = await authenticate(email, password)

        if (!result) {
            res.status(401).json({ error: "E-mail ou senha incorretos." })
            return
        }

        createCookie(res, result.token)
        res.status(200).json({ user: result.user })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Não foi possível fazer login." })
    }
}

export function logout(_req: Request, res: Response) {
    clearCookie(res)
    res.sendStatus(204)
}

export async function currentuser(req: IAuthRequest, res: Response) {
    const user = await getUserById(req.user!.id)

    if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." })
        return
    }

    res.status(200).json({ user })

}

export async function allUsers(req: Request, res: Response) {
    try {

        const users = await getAllUsers()

        res.status(200).json({ users })

    } catch (error) {
        console.error("Erro ao carregar todos os usuários", error)
        res.status(500).json({ errors: "Não foi possível carregar todos os usuários." })
    }
}

export async function changeRole(req: IAuthRequest, res: Response) {

    const { id } = req.params
    const { role } = req.body

    try {
        await updateUserRole({ id: Number(id), role })
        await publishMessage('user_updated', { id, role })
        res.status(201).json({ msg: "Usuário atualizado com sucesso" })
    } catch (error) {
        console.error("Erro ao atualizar tipo de usuário", error)
        res.status(500).json({ errors: "Não foi possível atualizar o tipo de usuário." })
    }

}

export async function syncAllUsers(req: IAuthRequest, res: Response) {
    const users = await getAllUsers()

    users.forEach(async (user) => {
        await publishMessage('user_created', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        })
    })

    res.status(200).json({ msg: "Usuários sincronizados." })
}