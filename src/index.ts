import express, { NextFunction, Request, Response } from 'express';
import userRouter from './routes/user.routes';
import databaseService from './services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';

const app = express()
const port = 4000

app.use(express.json())
app.use('/users', userRouter)

databaseService.connect()

app.listen(port, () => {
  console.log(`app running on port ${port}`)
})
app.use(defaultErrorHandler);

