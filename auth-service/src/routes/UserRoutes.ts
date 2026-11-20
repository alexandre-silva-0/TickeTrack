import { Router } from "express";

//From controller
import { createUserByAdmin, login, currentuser, allUsers, changeRole, syncAllUsers, logout } from "../controllers/UserController.js";

//helpers
import { createUserValidation, userLoginValidation } from "../validators/auth-validations.js";
import validate from "../middlewares/validate.js";
import { checkToken, checkAuthorization } from "../middlewares/auth.js";
import { changeRoleValidation } from "../validators/user-validations.js";

const router = Router()

router.post('/api/auth/login', userLoginValidation, validate, login)
router.post('/api/auth/logout', logout)
router.get('/api/users/me', checkToken, currentuser)
router.get('/api/users', checkToken, checkAuthorization, allUsers)
router.post('/api/users', checkToken, checkAuthorization, createUserValidation, validate, createUserByAdmin)
router.patch('/api/users/:id/role', checkToken, checkAuthorization, changeRoleValidation, validate, changeRole)
router.post('/api/users/sync', checkToken, checkAuthorization, syncAllUsers)

export default router