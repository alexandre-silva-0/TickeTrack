import { Response } from "express";

interface ISuccessOptions<T> {
    status: number
    data?: T
    msg?: string
}

interface ErrorBody {
    error: string
    details?: string[]
}

export function sendSuccess<T>(res: Response, { status = 200, data, msg }: ISuccessOptions<T>) {
    if (status === 204) {
        res.sendStatus(204)
        return
    }

    const body: { msg?: string, data?: T } = {}
    if (msg) body.msg = msg
    if (data !== undefined) body.data = data

    res.status(status).json(body)
}

export function sendError(res: Response, status: number, message: string, details?: string[]) {
    const body: ErrorBody = { error: message }
    if (details && details.length > 0) body.details = details

    res.status(status).json(body)
}