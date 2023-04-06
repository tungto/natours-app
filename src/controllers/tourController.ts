import { NextFunction, Request, Response } from 'express';
import Tour from '../models/tourSchema';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

// GET ALL
export const getAllTours = catchAsync(async (req: Request, res: Response) => {
  const tours = await Tour.find({});

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

// GET ONE
export const getTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('================================================================');
  console.log('===', req.params.id);
  let tour;

  /**
   * Mongoose's findById method casts the ID parameter to the type of the
   * model's _id field so that it can properly query for the matching doc
   * so we need to check if query ID valid before query
   * https://stackoverflow.com/questions/14940660/whats-mongoose-error-cast-to-objectid-failed-for-value-xxx-at-path-id
   */
  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    // Yes, it's a valid ObjectId, proceed with `findById` call.
    tour = await Tour.findById(req.params.id);
  }

  if (!tour) {
    /**
     * source: https://expressjs.com/en/guide/error-handling.html
     * For errors returned from async functions invoked by route
     * handlers and middleware, we must past them to the next() function
     * where Express will catch and process them
     */
    console.log('================================ DO WE GO IN HERE');
    return next(new AppError(`Tour not found`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// CREATE
export const createTour = catchAsync(async (req: Request, res: Response) => {
  const tour = Tour.create(req.body);
  console.log(tour);

  res.status(201).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// UPDATE => findByIdAndUpdate
export const updateTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // TODO: why we need to return a new one not just the altered here?
  // Run validator again? double check to make sure data is conform the schema?
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedTour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(201).json({
    status: 'success',
    data: {
      tour: updatedTour,
    },
  });
});

// DELETE
export const deleteTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    next(new AppError(`Tour not found`, 404));
  }

  res.status(204).json({ status: 'success', data: null });
});
