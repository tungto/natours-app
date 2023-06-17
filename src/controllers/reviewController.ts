import { NextFunction, Response } from 'express';
import Review from '../models/reviewModel';
import { IGetUserAuthInfoRequest } from './authController';
import * as factory from './handlerFactory';

export const setTourUserIds = (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user?.id;
  next();
};

export const getAllReview = factory.getAll(Review);
export const createReview = factory.createOne(Review);
export const getReview = factory.getOne(Review);
export const deleteReview = factory.deleteOne(Review);
export const updateReview = factory.updateOne(Review);
