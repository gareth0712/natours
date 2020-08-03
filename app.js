const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

// 1) Middlewares
// For logging
app.use(morgan('dev'));

// For access of req.body
app.use(express.json());

// For custom middleware
app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
});

// For showing date and time of request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Convert the JSON to JS object / an array of JS object
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// 2) Route handlers
const getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { 
      tours,
    },
  });
};

const getTour = (req, res) => {
  console.log(req.params);
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  
  // if (id >= tours.length) {
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
      status: 'success',
      data: { 
      tours: tour,
    },
    });
};

const createTour = (req, res) => {
  // console.log(req.body)

  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`, 
    JSON.stringify(tours), 
    (err) => {
      res.status(201).json({
        // 201 stands for created
        status: 'success',
        data: {
          tour: newTour,
        },
      });
        }
  );
};

const updateTour = (req, res) => {
  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) Routes
// Middleware for routing
const tourRouter = express.Router();

tourRouter.route('/').get(getAllTours).post(createTour);
tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);


// We want to use the middleware for this specific route "/api/v1/tours"
// The following process is called mounting a new router on a route
app.use('/api/v1/tours', tourRouter);

// 4) Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});