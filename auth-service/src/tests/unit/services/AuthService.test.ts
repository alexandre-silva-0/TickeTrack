import { describe, it, expect, vi, beforeEach } from "vitest";

import { authenticate } from "../../../services/AuthService.js";
import { getUserByEmail } from "../../../repositories/UserRepository.js";
import { checkPassword } from "../../../utils/bcrypt.js";
import { generateToken } from "../../../utils/jwt.js";
import type { User } from "../../../models/User.js";

// Os caminhos do vi.mock precisam ser iguais aos dos imports acima
vi.mock("../../../repositories/UserRepository.js");
vi.mock("../../../utils/bcrypt.js");
vi.mock("../../../utils/jwt.js");

// Usuário falso, como se viesse do banco
const fakeUser = {
    id: 1,
    name: "Ana",
    email: "ana@empresa.com",
    role: "agent",
    hashedPassword: "hash-da-senha",
} as unknown as User;

describe("AuthService.authenticate", () => {
    beforeEach(() => {
        vi.resetAllMocks(); // cada teste começa com os mocks zerados
    });

    it("devolve null quando o e-mail não está cadastrado", async () => {
        // Arrange: o "banco" não encontra ninguém com esse e-mail
        vi.mocked(getUserByEmail).mockResolvedValue(null);

        // Act
        const result = await authenticate("ninguem@empresa.com", "qualquer-senha");

        // Assert
        expect(result).toBeNull();
        expect(getUserByEmail).toHaveBeenCalledWith("ninguem@empresa.com");
        expect(checkPassword).not.toHaveBeenCalled();
        expect(generateToken).not.toHaveBeenCalled();
    });

    it("devolve null quando a senha está errada", async () => {
        // Arrange: o usuário existe, mas a senha não confere
        vi.mocked(getUserByEmail).mockResolvedValue(fakeUser);
        vi.mocked(checkPassword).mockReturnValue(false);

        // Act
        const result = await authenticate("ana@empresa.com", "senha-errada");

        // Assert
        expect(result).toBeNull();
        expect(checkPassword).toHaveBeenCalledWith("senha-errada", "hash-da-senha");
        expect(generateToken).not.toHaveBeenCalled();
    });

    it("devolve o usuário público e o token quando as credenciais estão certas", async () => {
        // Arrange: usuário existe, senha confere, token gerado
        vi.mocked(getUserByEmail).mockResolvedValue(fakeUser);
        vi.mocked(checkPassword).mockReturnValue(true);
        vi.mocked(generateToken).mockReturnValue("token-falso");

        // Act
        const result = await authenticate("ana@empresa.com", "senha-certa");

        // Assert
        expect(result).toEqual({
            user: { id: 1, name: "Ana", email: "ana@empresa.com", role: "agent" },
            token: "token-falso",
        });
        expect(checkPassword).toHaveBeenCalledWith("senha-certa", "hash-da-senha");
        expect(generateToken).toHaveBeenCalledWith(1, "agent");
    });

    it("nunca expõe o hash da senha no retorno", async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(fakeUser);
        vi.mocked(checkPassword).mockReturnValue(true);
        vi.mocked(generateToken).mockReturnValue("token-falso");

        const result = await authenticate("ana@empresa.com", "senha-certa");

        expect(result?.user).not.toHaveProperty("hashedPassword");
    });

    it("propaga o erro quando a consulta ao banco falha", async () => {
        // Arrange: o banco está fora do ar
        vi.mocked(getUserByEmail).mockRejectedValue(new Error("Banco indisponível"));

        // Act + Assert: o erro sobe para o errorHandler, que responde 500
        await expect(authenticate("ana@empresa.com", "senha-certa")).rejects.toThrow("Banco indisponível");
        expect(checkPassword).not.toHaveBeenCalled();
        expect(generateToken).not.toHaveBeenCalled();
    });
});
