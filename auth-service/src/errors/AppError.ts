export class AppError extends Error {
    statusCode: number
    details: string[] | undefined

    constructor(message: string, statusCode: number, details?: string[]) {
        super(message)
        this.name = 'AppError'
        this.statusCode = statusCode
        this.details = details
    }
}