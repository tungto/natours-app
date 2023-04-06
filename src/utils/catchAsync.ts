import { NextFunction, Request, Response } from 'express';

/**
 * Here we get the async function as input, call the cb and catch error
 * Use promises to avoid the overhead of the try...catch block or when using
 * functions that return promises
 * @param fn
 * @returns
 */
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
