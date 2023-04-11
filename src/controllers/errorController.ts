import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import * as dotenv from 'dotenv';

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

// TODO - to be define
const handleValidationErrorDB = (err: AppError) => {
  console.log('================================');
  console.log(err);
  return err;
};

const developmentError = (err: AppError, res: Response) => {
  console.log('ERROR', err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const prodError = (err: AppError, res: Response) => {
  // operational error: send message to client about the error
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Sends a generic message to the client about the error
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again!',
    });
  }
};

export const globalErrorHandler = (err: AppError, req: Request, res: Response) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.log('================================');

  if (process.env.NODE_ENV === 'development') {
    console.log('LOG DEVELOPMENT ERROR');
    developmentError(err, res);
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('PRODUCTION ERROR =============');
    let error = { ...err };

    error = handleValidationErrorDB(error);

    prodError(error, res);
  }
};
