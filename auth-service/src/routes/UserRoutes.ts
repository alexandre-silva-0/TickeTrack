import { Router } from "express";

//From controller
import { register, login, currentuser, allUsers, changeRole, syncAllUsers, logout } from "../controllers/UserController.js";

//helpers
import { userRegisterValidation, userLoginValidation } from "../helpers/auth-validations.js";
import { validate } from "../helpers/handle-validations.js";
import { checkToken } from "../helpers/jwt-helper.js";
import { changeRoleValidation, checkAuthorization } from "../helpers/user-validations.js";

const router = Router()

router.post('/api/auth/register', userRegisterValidation, validate, register)
router.post('/api/auth/login', userLoginValidation, validate, login)
router.post('/api/auth/logout', logout)
router.get('/api/users/me', checkToken, currentuser)
router.get('/api/users/', checkToken, allUsers)
router.patch('/api/users/:id/role', checkToken, checkAuthorization, changeRoleValidation, validate, changeRole)
router.post('/api/users/sync', checkToken, checkAuthorization, syncAllUsers)

export default router