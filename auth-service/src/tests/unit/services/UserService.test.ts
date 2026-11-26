import { describe, beforeEach, it, vi, expect } from "vitest";
import { getUserByEmail } from "../../../repositories/UserRepository.js";
import { User } from "../../../models/User.js";
import { createNewUser } from "../../../services/UserService.js";
import { ICreateUserBody } from "../../../dtos/auth.dto.js";


vi.mock("../../../repositories/UserRepository.js")
vi.mock("../../../services/UserService.js")

const fakeUser = {
    id: 1,
    name: 'nome do usuario da silva',
    email: "usuario@email.com",
    role: 'agent',
    hashedPassword: 'hash-da-senha'
} as unknown as User

const newFakeUser: ICreateUserBody = {
    name: 'nome do usuario da silva',
    email: "usuario@email.com",
    role: 'agent',
    password: 'nova-senha'
}


describe("UserService.tests", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('devolve AppError com 409 se email já estiver cadastrado', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null)

        //act 
        const result = await createNewUser(newFakeUser)


    })

})