const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
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

// 4) Start server in server.js
module.exports = app;
