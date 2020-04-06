const mongoose = require('mongoose');
const fs = require('fs');
const chalk = require('chalk');

const ENVIRONMENT = process.env.ENVIRONMENT;

let connectedToDatabase = false;

// load database config
let mongoUrl;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

if (ENVIRONMENT === 'production') {
  mongoUrl = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`;
} else {
  mongoUrl = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
}

// config mongoose
mongoose.set('useFindAndModify', false);
const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
};

/*
 * connectToDatabase attempts to connect to mongoDB database
 * @return: true if the conenction was successfully made, false otherwise
 */
async function connectToDatabase() {
  // TODO this isn't working, multiple connections are being opened
  if (connectedToDatabase) {
    return true;
  }

  try {
    console.log(`Database URL: ${mongoUrl}`);
    await mongoose.connect(mongoUrl, mongooseConfig);
    console.log('connected to database');
  } catch (err) {
    console.error(chalk.red(`connection error: ${err}`));
    return false;
  }

  return true;
}

module.exports = connectToDatabase;
