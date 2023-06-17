import { NextFunction, Request, Response } from 'express';
import Tour from '../models/tourModel';
import { catchAsync } from '../utils/catchAsync';
import * as factory from './handlerFactory';

export const getAllTours = factory.getAll(Tour);
export const getTour = factory.getOne(Tour, { path: 'reviews' });
export const createTour = factory.createOne(Tour);
export const updateTour = factory.updateOne(Tour);
export const deleteTour = factory.deleteOne(Tour);

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
