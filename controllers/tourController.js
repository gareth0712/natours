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

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getNames = catchAsync(async (req, res, next) => {
  const tours = await Tour.aggregate([
    {
      $project: {
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: tours,
  });
});

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

// route /tours-within/:distance/center/:latlng/unit/:unit
// route /tours-within/233/center/-40,45/unit/mi
// For geospatial query, we must create an index for the geospatial field
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // distance from center: mongodb expects radius of sphere to be in radian
  // radius = distance / radius of the earth => radius of earth = 3963.2 miles or 6378.1 km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng'
      ),
      400
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  // unit is the resulting distance unit, by default it returns meters which is not very readable
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621361 : 0.001; // from m to mi vs from m to km
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng'
      ),
      400
    );
  }

  const distances = await Tour.aggregate([
    {
      // Always need to be the first stage; at least 1 of the fields of the model contains geospatial index
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], // lng comes first in mongodb coordinates; * 1 to convert to no.
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier, // from m to km
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
