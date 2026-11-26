import { describe, beforeEach, it, vi, expect } from "vitest";
import { createUser, getUserByEmail, getUserById, updateUserRole } from "../../../repositories/UserRepository.js";
import type { User } from "../../../models/User.js";
import { createNewUser, updateRole } from "../../../services/UserService.js";
import type { ICreateUserBody } from "../../../dtos/auth.dto.js";
import { createHashedPassword } from "../../../utils/bcrypt.js";
import { publishMessage } from "../../../config/rabbitmq.js";

// Dependências do UserService substituídas por mocks: nada de banco, bcrypt ou RabbitMQ de verdade
vi.mock("../../../repositories/UserRepository.js")
vi.mock("../../../utils/bcrypt.js")
vi.mock("../../../config/rabbitmq.js")

// Usuário como o banco devolve (com o hash)
const fakeUser = {
    id: 1,
    name: 'nome do usuario da silva',
    email: "usuario@email.com",
    role: 'agent',
    hashedPassword: 'hash-da-senha'
} as unknown as User

// Dados de entrada da criação, como chegam do controller
const newFakeUser: ICreateUserBody = {
    name: 'nome do usuario da silva',
    email: "usuario@email.com",
    password: 'nova-senha',
    role: 'agent',
}

// O que pode sair do service: sem o hash
const publicUser = {
    id: 1,
    name: 'nome do usuario da silva',
    email: "usuario@email.com",
    role: 'agent',
}

beforeEach(() => {
    vi.resetAllMocks()
})

describe("createNewUser", () => {

    // Cenário de sucesso, usado por vários testes abaixo
    function arrangeSuccessfulCreation() {
        vi.mocked(getUserByEmail).mockResolvedValue(null);
        vi.mocked(createHashedPassword).mockReturnValue('hash-da-senha');
        vi.mocked(createUser).mockResolvedValue(fakeUser);
    }

    it("lança AppError 409 quando o e-mail já está cadastrado", async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(fakeUser);

        await expect(createNewUser(newFakeUser)).rejects.toMatchObject({
            statusCode: 409,
            message: "E-mail já cadastrado.",
        });
        expect(createHashedPassword).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();
        expect(publishMessage).not.toHaveBeenCalled();
    });

    it("salva a senha em hash, nunca a senha original", async () => {
        arrangeSuccessfulCreation();

        await createNewUser(newFakeUser);

        expect(createHashedPassword).toHaveBeenCalledWith('nova-senha');
        // toHaveBeenCalledWith compara o objeto inteiro: um campo "password" extra faria o teste falhar
        expect(createUser).toHaveBeenCalledWith({
            name: 'nome do usuario da silva',
            email: "usuario@email.com",
            hashedPassword: 'hash-da-senha',
            role: 'agent',
        });
    });

    it("publica user_created uma vez, com o usuário público", async () => {
        arrangeSuccessfulCreation();

        await createNewUser(newFakeUser);

        expect(publishMessage).toHaveBeenCalledWith('user_created', publicUser);
        expect(publishMessage).toHaveBeenCalledTimes(1);
    });

    it("devolve o usuário público, sem o hash da senha", async () => {
        arrangeSuccessfulCreation();

        const result = await createNewUser(newFakeUser);

        expect(result).toEqual({ user: publicUser });
        expect(result.user).not.toHaveProperty('hashedPassword');
    });

    it("cria o usuário com o papel informado", async () => {
        arrangeSuccessfulCreation();
        const supervisor: ICreateUserBody = { ...newFakeUser, role: 'supervisor' };

        await createNewUser(supervisor);

        expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'supervisor' }));
    });

    it("não publica evento quando o banco falha ao criar o usuário", async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);
        vi.mocked(createHashedPassword).mockReturnValue('hash-da-senha');
        vi.mocked(createUser).mockRejectedValue(new Error("Banco indisponível"));

        await expect(createNewUser(newFakeUser)).rejects.toThrow("Banco indisponível");
        expect(publishMessage).not.toHaveBeenCalled();
    });

})

describe("updateRole", () => {

    // O getUserById exclui o hash, então o usuário existente vem sem ele
    const existingUser = {
        id: 1,
        name: 'nome do usuario da silva',
        email: "usuario@email.com",
        role: 'customer',
    } as unknown as User

    it("lança AppError 404 quando o usuário não existe", async () => {
        vi.mocked(getUserById).mockResolvedValue(null);

        await expect(updateRole({ id: 99, role: 'agent' })).rejects.toMatchObject({
            statusCode: 404,
            message: "Usuário não encontrado.",
        });
        expect(updateUserRole).not.toHaveBeenCalled();
        expect(publishMessage).not.toHaveBeenCalled();
    });

    it("atualiza o papel do usuário", async () => {
        vi.mocked(getUserById).mockResolvedValue(existingUser);

        await updateRole({ id: 1, role: 'agent' });

        expect(getUserById).toHaveBeenCalledWith(1);
        expect(updateUserRole).toHaveBeenCalledWith({ id: 1, role: 'agent' });
    });

    it("publica user_role_updated com o id e o papel novo", async () => {
        vi.mocked(getUserById).mockResolvedValue(existingUser);

        await updateRole({ id: 1, role: 'agent' });

        expect(publishMessage).toHaveBeenCalledWith('user_role_updated', { id: 1, role: 'agent' });
        expect(publishMessage).toHaveBeenCalledTimes(1);
    });

    it("não publica evento quando a atualização no banco falha", async () => {
        vi.mocked(getUserById).mockResolvedValue(existingUser);
        vi.mocked(updateUserRole).mockRejectedValue(new Error("Banco indisponível"));

        await expect(updateRole({ id: 1, role: 'agent' })).rejects.toThrow("Banco indisponível");
        expect(publishMessage).not.toHaveBeenCalled();
    });

})
