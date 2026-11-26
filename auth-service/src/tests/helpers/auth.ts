import { generateToken } from "../../utils/jwt.js";
import { AUTH_COOKIE_NAME } from "../../utils/cookie.js";

type Role = "customer" | "agent" | "supervisor" | "admin";

// Monta o cabeçalho Cookie de um usuário logado, com um JWT válido de verdade
export function authCookie(id: number, role: Role) {
    return `${AUTH_COOKIE_NAME}=${generateToken(id, role)}`;
}
