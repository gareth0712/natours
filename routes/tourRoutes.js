const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
// We can also apply destructuring for shorter variable names
// const { getAllTours, createTour, getTour, updateTour, deleteTour } = require('./../controllers/tourController');
const router = express.Router();

// Mounting another router
// For this specific route, we want to redirect to reviewRouter instead
// Without using mergeParams, reviewRouter won't have access to params.tourId
router.use('/:tourId/reviews', reviewRouter);
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router
  .route('/name')
  .get(tourController.aliasTourName, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
