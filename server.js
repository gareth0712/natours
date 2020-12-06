const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Events and events' listeners
// Unhandled exception: Errors / Bugs occurred in synchoronous code but are not handled anywhere
// Each time there is uncaught exception somewhere in the application, the process object will emit an object called 'uncaughtException'
// So we can subscribe to the event 'uncaughtException' and handle it here
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught exception. Shutting down server...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

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
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
