import { Response, CookieOptions } from "express";

const options: CookieOptions = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'development' ? false : true
}

export const AUTH_COOKIE_NAME = 'token'

export const createCookie = (res: Response, token: string) => {
    res.cookie(AUTH_COOKIE_NAME, token, options)
}

export const clearCookie = (res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME, options)
}