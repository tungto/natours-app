import express from 'express';
import * as tourController from './../controllers/tourController';
import * as authController from '../controllers/authController';

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

tourRouter.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

tourRouter
  .route('/')
  .get(authController.protectRoute, tourController.getAllTours)
  .post(tourController.createTour);

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

export default tourRouter;
