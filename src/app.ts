import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import tourRouter from './routes/tour.routes';
import * as dotenv from 'dotenv';
import { globalErrorHandler } from './controllers/errorController';
import { AppError } from './utils/AppError';
import userRouter from './routes/user.routes';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xss = require('xss-clean');
dotenv.config();

const app = express();

app.use(cors());
app.use(cookieParser());

// Security HTTP headers
app.use(helmet());

// log on development env
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Body Parser, reading data from body to req.body - parse incoming requests
//with JSON payloads and is base on body - parser
app.use(express.json({ limit: '10kb' }));
// setup static folder
app.use(express.static(`${__dirname}/public`));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// prevent http parameter pollution
// *make sure the body is parsed beforehand
app.use(
  //  todo refactor
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Test Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Limit requests from same API
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 100,
  message: 'To many request from this IP, please try again in an hour!',
});
app.use('/api', apiLimiter);

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
