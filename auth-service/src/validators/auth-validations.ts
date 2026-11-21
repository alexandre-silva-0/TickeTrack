import { body, ValidationChain } from "express-validator";

export const createUserValidation: ValidationChain[] = [
    body("name")
        .notEmpty().withMessage("O nome é obrigatório.")
        .isString().withMessage("Valor inválido."),
    body("email")
        .notEmpty().withMessage("O e-mail é obrigatório.")
        .isEmail().withMessage("Insira um e-mail válido."),
    body("role")
        .notEmpty().withMessage("O tipo de usuário é obrigatório.")
        .isIn(['agent', 'customer', 'supervisor', 'admin']).withMessage('Tipo de usuário inválido, selecione um dos valores acima.'),
    body("password")
        .notEmpty().withMessage("Insira uma senha.")
        .isString().withMessage('Valor inválido.')
        .isLength({ min: 6 }).withMessage("A senha deve ter no mínimo 6 caracteres."),
    body("confirmPassword")
        .notEmpty().withMessage("Confirme a senha.")
        .isString().withMessage('Valor inválido.')
        .custom((value, { req }) => {
            const { password } = req.body

            if (value !== password) {
                throw new Error("As senhas estão diferentes.")
            }
            return true
        })
    ,

]


export const userLoginValidation: ValidationChain[] = [
    body('email')
        .notEmpty().withMessage("O e-mail é obrigatório.")
        .isEmail().withMessage("Insira um e-mail válido."),
    body('password')
        .notEmpty().withMessage('Informe sua senha.')

]