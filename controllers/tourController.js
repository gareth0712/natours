const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
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

    // Send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Shorthand for findOne()
    // Tour.findOne({ _id: req.params.id })

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      // 201 stands for created
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 'fail',
      message: 'Invalid tour given in the request body. Tour not created.',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // findByIdAndUpdate method
    // 1st: id to identify the doc
    // 2nd: what data should be updated
    // 3rd: other options: e.g. { new: true } means asking the method to return the updated tour
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e,
    });
  }
};
