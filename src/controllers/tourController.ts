import { NextFunction, Request, Response } from 'express';
import Tour, { ITour } from '../models/tourSchema';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { APIFeatures, ReqQuery } from '../utils/apiFeatures';

// GET ALL
export const getAllTours = catchAsync(async (req: Request, res: Response) => {
  // const tours = await Tour.find().sort({ name: 'desc' }).limit(3).skip(skip);

  // Find method here will return a query => we can chained
  // only AWAIT when added series of operation you want to do with the query
  // because this method return a query so I will name is query
  //https://mongoosejs.com/docs/tutorials/query_casting.html
  const query: Promise<ITour[]> = Tour.find();

  // TODO FIXED TYPE
  const features = new APIFeatures(query, req.query as unknown as ReqQuery);
  const tours = await features.filter().sort().limitFields().paginate().query;

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
  /**
   * Mongoose's findById method casts the ID parameter to the type of the
   * model's _id field so that it can properly query for the matching doc
   * so we need to check if query ID valid before query
   * https://stackoverflow.com/questions/14940660/whats-mongoose-error-cast-to-objectid-failed-for-value-xxx-at-path-id
   *
   * * we will handle the cast error on global handler,
   * this error is not same as not found id
   */
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    /**
     * source: https://expressjs.com/en/guide/error-handling.html
     * For errors returned from async functions invoked by route
     * ! handlers and middleware, we must past them to the next() function
     * where Express will catch and process them
     */
    // return the function immediately, not move on to next line
    return next(new AppError(`No tour found with that ID`, 404));
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
  const tour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// UPDATE => findByIdAndUpdate
export const updateTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // * Set new = true to return latest value
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedTour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
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

  console.log('TOUR DELETED SUCCESSFUL!');

  res.status(204).json({ status: 'success', data: null });
});

export const aliasTopTours = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
});

// rating > 4.5
// sort avg price
//
export const getTourStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        // get tours have rating > 4.9
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        // _id: null,  // group all tours in one
        _id: '$difficulty', // group by DIFFICULTY
        // _id: '$price', // group by price,
        // _id: '$ratingsAverage',
        // CALCULATE BASE ON TOURS MATCH RATING AVG > 4.5
        numTours: { $sum: 1 }, // We add 1 for each tour found
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    {
      // remove easy tour from stats
      $match: {
        _id: {
          $ne: 'easy',
        },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

/**
 * In this route we want to return tours array with these fields
 * numToursStart in the month of select year
 * array of name of tours in that month
 * month
 */
export const getMonthlyPlan = catchAsync(async (req: Request, res: Response) => {
  const year = +req.params.year;

  const tours = await Tour.aggregate([
    /**
     * Each tour have a array of startDates like below,
     * to separate each tour by start date we use unwind
     *
     */

    // [
    //   "2021-07-19T03:00:00.000Z",
    //   "2021-09-06T03:00:00.000Z",
    //   "2022-03-18T03:00:00.000Z"
    //   ]

    { $unwind: { path: '$startDates' } },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: '$startDates',
        },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },

    {
      $addFields: {
        month: '$_id',
      },
    },

    {
      // include and exclude fields: 1 show, 0 hide
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },

    {
      $limit: 6,
    },
  ]);

  res.status(201).json({
    status: 'success',
    data: {
      tours,
    },
  });
});
