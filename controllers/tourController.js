const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    // Build query
    // Query: method 1 - using filter in find
    // const tours = await Tour.find({ difficulty: 'easy' });
    // Query: method 2 - mongoose alternative method
    // const tours = await Tour.find().where('difficulty').equals('easy');

    // 1) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // handle operators: gte, gt, lte, lt
    // api: /api/v1/tours?difficulty=easy&duration[gte]=5
    // mongodb shell: db.tours.find({ difficulty: 'easy', duration: { $gte: 5 } })
    // mongoose: .find()
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query = Tour.find(JSON.parse(queryStr));

    // Execute query - Await only at the end after it finishes handling pagination, sort etc
    const tours = await query;

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
      message: e,
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
