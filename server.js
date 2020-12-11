const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

// Events and events' listeners
// Unhandled exception: Errors / Bugs occurred in synchoronous code but are not handled anywhere
// Each time there is uncaught exception somewhere in the application, the process object will emit an object called 'uncaughtException'
// So we can subscribe to the event 'uncaughtException' and handle it here
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught exception. Shutting down server...');
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'))
  .catch((e) => console.log(`Error connecting to database: ${e}`));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Events and events' listeners
// Unhandled rejection: Errors / Bugs occurred in asynchoronous code but are not handled anywhere
process.on('unhandledRejection', (err) => {
  // name and message are defaults for error object in nodejs
  console.log(err.name, err.message);
  console.log('Unhandled rejection. Shutting down server...');
  // End the application gracefully after the server finishes handling incoming requests
  server.close(() => {
    // Exit code 1 for uncaught exception
    process.exit(1);
  });
});
