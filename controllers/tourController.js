const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.aliasTourName = (req, res, next) => {
  req.query.fields = 'name';
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
  const tour = await Tour.findById(req.params.id).populate('reviews');
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

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Returns an aggregate object
  // stages in array will go through one by one
  // Each stages can be placed more than one time
  const stats = await Tour.aggregate([
    {
      // match stage: Select or filter our ratings higher than 4.5
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      // group stage: group documents together using accumulator
      $group: {
        // _id indicates what we want to group by
        //_id: null, // null indicates to do the operation on all documents as a group
        // _id: '$difficulty', // grouped by difficulties
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, // each document will go through this num counter and adds one to num
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
    // stages can repeat too
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
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
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, // Not showing _id
      },
    },
    {
      $sort: { numTourStarts: 1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
