import * as dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { AppError } from '../utils/AppError';

dotenv.config();

/**
 * For error we need to know these info
 * - is operational error => is yes sent the error to client, if not send a general message
 * - status: fail, error
 * - statusCode: 400, 500, 404...
 * - message
 * - error it self
 * - stack
 * https://buttercms.com/blog/express-js-error-handling/
 */

// HANDLE ERROR FOR DB
const handleDuplicateError = (err: MongoServerError) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationError = (err: MongoServerError) => {
  // TODO fixed type
  const errors = Object.values(err.errors)
    .map((el: any) => el.message)
    .join(' .');

  return new AppError(errors, 400);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleJsonWebTokenError = (_err: MongoServerError) => {
  const message = 'Invalid token. Please login again!';
  return new AppError(message, 401);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleTokenExpiredError = (_err: MongoServerError) => {
  const message = 'Token expired. Please login again!';
  return new AppError(message, 401);
};

const handleCastError = (err: MongoServerError) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const developmentError = (err: AppError, res: Response) => {
  console.log('DEVELOPMENT ERROR', err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const prodError = (err: AppError | MongoServerError, res: Response) => {
  // operational, trusted error: send message to client about the error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    // 1. Log the error
    console.error('PRODUCTION ERROR', err);

    // 2. Sends a generic message to the client about the error
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again!',
    });
  }
};

/**
 * For Development ENV, we just need to log and send all the errors
 * For Production ENV, we need to treat programming/ untrusted
 * and operational/ trusted error in different ways
 * - operational/ trust error: send the error to client
 * - programming/ unknown error: don't leak it,
 * log the error and send generic message like - 'sth went wrong!'
 */
export const globalErrorHandler = (
  err: AppError | MongoServerError,
  req: Request,
  res: Response,
  /**
   * ! CUSTOM ERROR-HANDLING MIDDLEWARE NEED TO HAVE 4 ARGUMENTS
   * * (err, req, res, next), If not, it won't fire
   * https://expressjs.com/en/guide/error-handling.html
   * https://stackoverflow.com/questions/29700005/express-4-middleware-error-handler-not-being-called
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const DUPLICATED_ERROR_CODE = 11000;
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    developmentError(err as AppError, res);
  } else if (process.env.NODE_ENV === 'production') {
    // ! NOT SURE WHY NAME DOESN'T INCLUDE WHEN CLONE THIS ERR
    let error = Object.assign({ ...err, name: err.name }, err) as AppError | MongoServerError;

    /**
     * ! MONGODB ERROR DO NOT MARK AS OPERATIONAL ERROR
     * SO WE NEED TO HANDLE IT IN HERE
     */

    // RETURN NEW ERROR ON CAST ERROR
    if (error.name === 'CastError') {
      error = handleCastError(error as MongoServerError);
    }

    if (error.name === 'ValidationError') {
      error = handleValidationError(error as MongoServerError);
    }

    if ((error as MongoServerError).code === DUPLICATED_ERROR_CODE) {
      error = handleDuplicateError(err as MongoServerError);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError(err as MongoServerError);
    }

    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError(err as MongoServerError);
    }

    prodError(error, res);
  }
};
