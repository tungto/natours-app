import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import tourRouter from './routes/tour.routes';
import * as dotenv from 'dotenv';
import { globalErrorHandler } from './controllers/errorController';
import { AppError } from './utils/AppError';
import userRouter from './routes/user.routes';
dotenv.config();

const app = express();

app.use(cors());

// log on development env
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// parse incoming requests
//ith JSON payloads and is base on body - parser
app.use(express.json());

// setup static folder
app.use(express.static(`${__dirname}/public`));

app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

//3.ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/**
 * ! CUSTOM ERROR-HANDLING MIDDLEWARE NEED TO HAVE 4 ARGUMENTS
 * * (err, req, res, next), If not, it won't fire
 * https://expressjs.com/en/guide/error-handling.html
 * https://stackoverflow.com/questions/29700005/express-4-middleware-error-handler-not-being-called
 */
app.use(globalErrorHandler);

export default app;
