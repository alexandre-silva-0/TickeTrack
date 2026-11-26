import 'dotenv/config'

//app
import { app } from './app.js'

//db connection
import database from './config/database.js'

//RabbitMQ
import { connectRabbitMQ } from './config/rabbitmq.js'

const startServer = async () => {

    await connectRabbitMQ()

    database
        .sync()
        // .sync({force: true})
        .then(() => {
            app.listen(process.env.PORT)
            console.log('Listening on port ', process.env.PORT)
        })
}

startServer()
