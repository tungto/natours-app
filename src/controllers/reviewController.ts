import { Request, Response } from 'express';
import Review from '../models/reviewSchema';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const getAllReview = catchAsync(async (req: Request, res: Response) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

export const createReview = catchAsync(async (req: Request, res: Response) => {
  const review = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

export const getReview = catchAsync(async (req: Request, res: Response, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('There is no  review with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

export const deleteReview = catchAsync(async (req: Request, res: Response, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return next(new AppError('There is no review with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const updateReview = catchAsync(async (req: Request, res: Response, next) => {
  const review = await Review.findByIdAndUpdate({
    review: req.body.review,
  });

  if (!review) {
    return next(new AppError('There is no review with that ID', 404));
  }

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});
