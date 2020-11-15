const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
    // Build query
    // Query: method 1 - using filter in find
    // const tours = await Tour.find({ difficulty: 'easy' });
    // Query: method 2 - mongoose alternative method
    // const tours = await Tour.find().where('difficulty').equals('easy');
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute query - Await only at the end after it finishes handling pagination, sort etc
    const tours = await features.query;

  // not handling tour == null as error since it is not an error when user's query returns no record

    // Send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
    });

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    // Shorthand for findOne()
    // Tour.findOne({ _id: req.params.id })

  // tour will return null if params don't match any document
  if (!tour) {
    // Once we pass parameter to next fn, it assumes that it is an error
    // And will then jump to the global error handling middleware in the stack
    return next(new AppError('No tour found with that ID', 404));
  }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
    });

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      // 201 stands for created
      status: 'success',
      data: {
        tour: newTour,
      },
    });
    });

exports.updateTour = catchAsync(async (req, res, next) => {
    // findByIdAndUpdate method
    // 1st: id to identify the doc
    // 2nd: what data should be updated
    // 3rd: other options: e.g. { new: true } means asking the method to return the updated tour
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
    });

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

    res.status(204).json({
      status: 'success',
      data: null,
    });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Returns an aggregate object
  // stages in array will go through one by one
  // Each stages can be placed more than one time
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        //_id: null, // null indicates to do the operation on all documents as a group
        // _id: '$difficulty', // grouped by difficulties
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 }, // each document will go through this num counter and adds one to num
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // for ascending
    },
    // Match again will be executed too
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
    });
