import express from 'express'
import cookieParser from 'cookie-parser'

//routes
import router from './routes/UserRoutes.js'

//middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'

// Monta e exporta o app, sem iniciar nada: sem banco, sem RabbitMQ, sem listen.
// Quem inicia o servidor é o index.ts. Os testes importam daqui.
export const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(router)
app.use(notFoundHandler)
app.use(errorHandler)
