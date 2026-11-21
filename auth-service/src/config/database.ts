import { Sequelize } from 'sequelize-typescript'

//models
import { User } from '../models/User.js'


const sequelize = new Sequelize({
    database: process.env.DB_NAME!,
    dialect: "mysql",
    username: process.env.DB_USER!,
    password: process.env.DB_PSSWD!,
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    models: [User]
})

const testConnection = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection has been established successfully')
    } catch (error) {
        console.error("Unable to connect to the database: ", error)
    }
}

testConnection()

export default sequelize