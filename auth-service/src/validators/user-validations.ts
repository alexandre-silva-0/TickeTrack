//dependencies
import { body, param, ValidationChain } from "express-validator";

export const changeRoleValidation: ValidationChain[] = [
    param('id')
        .notEmpty().withMessage("O id do usuário é obrigatório.")
        .isInt().withMessage("Insira um id válido.")
    ,
    body("role")
        .notEmpty().withMessage("O tipo de usuário é obrigatório.")
        .isIn(['agent', 'customer', 'supervisor', 'admin']).withMessage('Tipo de usuário inválido, selecione um dos valores acima.')
]