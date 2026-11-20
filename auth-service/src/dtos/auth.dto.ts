import { Request } from "express";

//Interface to create user route
export interface ICreateUserBody {
    name: string;
    email: string;
    password: string;
    role: 'agent' | 'customer' | 'supervisor' | 'admin'
}

//Interface to create a user
export interface ICreatedUserData {
    name: string;
    email: string;
    hashedPassword: string;
    role: 'agent' | 'customer' | 'supervisor' | 'admin'
}

//Interface to login route
export interface ILoginBody {
    email: string;
    password: string;
}

//Interface to check if the token is valid
export interface IAuthRequest extends Request {
    user?: {
        id: number;
        role: string
    }
}

//interface to check users info
export interface IUpdateUserRole {
    id: number,
    role: string,
}