import express from 'express';
import * as tourController from './../controllers/tourController';
import * as authController from '../controllers/authController';
import reviewRouter from './review.routes';

/**
 * Router can use as middleware and for routing
 * https://expressjs.com/en/4x/api.html#router
 */
const tourRouter = express.Router();

/**
 * ALIAS - instead of user need to fill in all the queries
 * We predefine to them
 * exec aliasTopTours before getAllTours
 */
tourRouter.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);
tourRouter.route('/tours-stats').get(tourController.getTourStats);

tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protectRoute,
    authController.restrictTo('lead-guide', 'admin', 'guide'),
    tourController.getMonthlyPlan,
  );

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protectRoute,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.createTour,
  );

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

/**
 * Nested route
 * https://gist.github.com/zcaceres/f38b208a492e4dcd45f487638eff716c
 */
tourRouter.use('/:tourId/reviews', reviewRouter);

export default tourRouter;
