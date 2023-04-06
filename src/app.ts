import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import tourRouter from './routes/tour.routes';
import * as dotenv from 'dotenv';
import { globalErrorHandler } from './controllers/errorController';
import { AppError } from './utils/AppError';
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

// app.use((req: Request, res: Response, next: NextFunction) => {
//   console.log('hello from the middleware');
//   next();
// });

app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', (req, res) => {
  res.send('hello');
});

app.use(globalErrorHandler);
app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

export default app;
