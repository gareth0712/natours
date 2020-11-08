const express = require('express');
const tourController = require('../controllers/tourController');
const { route } = require('./userRoutes');
// We can also apply destructuring for shorter variable names
// const { getAllTours, createTour, getTour, updateTour, deleteTour } = require('./../controllers/tourController');
const router = express.Router();

router.param('id', tourController.checkID);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
