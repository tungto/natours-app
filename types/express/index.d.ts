// extend Express Request obj in Typescript
declare namespace Express {
  export interface Request {
    requestTime: string;
  }
}
