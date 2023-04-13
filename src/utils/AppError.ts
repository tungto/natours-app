export class AppError extends Error {
  public status;
  public isOperational;
  constructor(message: string, public statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
