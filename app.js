const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) Middlewares
// For logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// For access of req.body
app.use(express.json());

// Serve static files
app.use(express.static(`${__dirname}/public`));

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

// 2) Route Handlers placed in routes directory

// 3) Routes
// We want to use the middleware for this specific route "/api/v1/tours"
// The following process is called mounting a new router on a route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// All HTTP methods; * stands for everything
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // Express assumes everything we pass to next is an error and this applies to every next function in every single middleware anywhere in our application
  // And will ignore other middlewares in the middleware stack and send the error that we pass in to the global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware: first argument is err
// By specifying the arguments in this way, Express automatically knows this entire function
// is error handling middleware
app.use(globalErrorHandler);

// 4) Start server in server.js
module.exports = app;
