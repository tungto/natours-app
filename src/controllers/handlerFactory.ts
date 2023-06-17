import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import mongoose, { PopulateOptions } from 'mongoose';
import { APIFeatures, ReqQuery } from '../utils/apiFeatures';
// TODO refactor the model type

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getOne = (Model: mongoose.Model<any>, popOptions?: PopulateOptions) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    /**
     * Mongoose's findById method casts the ID parameter to the type of the
     * model's _id field so that it can properly query for the matching doc
     * so we need to check if query ID valid before query
     * https://stackoverflow.com/questions/14940660/whats-mongoose-error-cast-to-objectid-failed-for-value-xxx-at-path-id
     *
     * * we will handle the cast error on global handler,
     * this error is not same as not found id
     */
    console.log(req.params);
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      /**
       * source: https://expressjs.com/en/guide/error-handling.html
       * For errors returned from async functions invoked by route
       * ! handlers and middleware, we must past them to the next() function
       * where Express will catch and process them
       */
      // return the function immediately, not move on to next line
      return next(new AppError(`No ${Model.name} found with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteOne = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    console.log(req);
    if (!doc) {
      next(new AppError(`No document found with that ID`, 404));
    }

    res.status(204).json({ status: 'success', data: null });
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateOne = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // * Set new = true to return latest value
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createOne = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAll = (Model: mongoose.Model<any>) =>
  catchAsync(async (req: Request, res: Response) => {
    // Find method here will return a query => we can chained
    // only AWAIT when added series of operation you want to do with the query
    // because this method return a query so I will name is query
    //https://mongoosejs.com/docs/tutorials/query_casting.html

    // * Temp - To allow for nested GET reviews on tour
    // *Note for the nested GET - to keep parent req.params, need to add {mergeParams: true}
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query as unknown as ReqQuery)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query.explain();
    console.log(`GET ${Model} DOCUMENT`);

    res.status(200).json({
      status: 'success',
      result: doc.length,
      data: {
        data: doc,
      },
    });
  });
