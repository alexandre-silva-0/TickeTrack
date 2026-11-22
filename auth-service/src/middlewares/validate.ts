import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../errors/AppError.js";

const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req)
    if (errors.isEmpty()) return next()

    const details = errors.array().map(err => String(err.msg))
    throw new AppError("Dados inválidos.", 422, details)
}

export default validate