//packages
import { Request, Response } from "express";

//helpers
import { createHashedPassword, checkPassword } from "../helpers/bcrypt-helper.js";
import { generateToken } from "../helpers/jwt-helper.js";

//repositories
import { createUser, getUserByEmail, getUserById, getAllUsers, updateUserRole } from "../repositories/UserRepository.js";

//interfaces
import { IAuthRequest, IRegisterBody } from "../dtos/auth.dto.js";
import { ICreatedUserData } from "../dtos/auth.dto.js";
import { ILoginBody } from "../dtos/auth.dto.js";

//RabbitMQ
import { publishMessage } from "../config/rabbitmq.js";
import { clearCookie, createCookie } from "../helpers/cookie-helper.js";

export async function register(req: Request<{}, {}, IRegisterBody>, res: Response): Promise<void> {
    const { name, email, role, password } = req.body

    //function to hash the password
    const hashedPassword = createHashedPassword(password)

    //Set the user
    const user: ICreatedUserData = {
        name, email, role, hashedPassword
    }

    try {
        //create the user in db
        const createdUser = await createUser(user)

        //create jwt token
        const token = generateToken(createdUser.id, createdUser.role)

        //register token in the cookie
        createCookie(res, token)

        //prepara o payload que vai para o rabbitmq
        const userCreatedEvent = {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role
        }

        //dispara a mensagem para a queue
        await publishMessage('user_created', userCreatedEvent)

        res.status(201).json({
            msg: "Usuário criado com sucesso.",
            user: {
                id: createdUser.id,
                email: createdUser.email,
                role: createdUser.role
            }
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: "Não foi possível criar sua conta." })
    }
}

export async function login(req: Request<{}, {}, ILoginBody>, res: Response) {

    const { email, password } = req.body

    try {
        const user = await getUserByEmail(email)

        if (!user) {
            return res.status(401).json({ msg: "E-mail ou senha incorretos, tente novamente." })
        }

        //compare if the password matches
        const isValidPassword = checkPassword(password, user!.hashedPassword)

        if (!isValidPassword) {
            return res.status(401).json({ msg: "E-mail ou senha incorretos, tente novamente." })
        }

        //create jwt token
        const token = generateToken(user.id, user.role)

        //register token in the cookie
        createCookie(res, token)

        res.status(200).json({
            msg: "Login realizado com sucesso.",
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ errors: "Não foi possível conectar à sua conta." })
    }
}

export function logout(req: Request, res: Response) {
    clearCookie(res)
    res.status(204)
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

    console.error(req.user)

    const { id, role } = req.body

    try {
        await updateUserRole({ id, role })

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