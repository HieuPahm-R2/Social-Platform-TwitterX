import express, { NextFunction, Request, Response } from 'express';
import userRouter from './routes/user.routes';
import databaseService from './services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';
import { initFolder } from './utils/file';
import { config } from 'dotenv';
import argv from 'minimist';

config()
const options = argv(process.argv.slice(2))
// follow order
databaseService.connect()
const app = express()
const port = 4000

// Check uploads folder has existed?
initFolder()

app.use(express.json())
app.use('/users', userRouter)
app.use('/medias', userRouter)
app.use(defaultErrorHandler);


app.listen(port, () => {
  console.log(`app running on port ${port}`)
})


