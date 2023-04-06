export class AppError extends Error {
  public status;
  public isOperational = true;
  constructor(message: string, public statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}
