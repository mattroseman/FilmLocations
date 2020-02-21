const mongoose = require('mongoose');
const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');

const { Location } = require('../lib/models.js');

const ENVIRONMENT = process.env.ENVIRONMENT;
const MAX_CONCURRENT_REQUESTS = +process.env.MAX_CONCURRENT_REQUESTS;

// load geocode API config
const GEOCODE_API_KEY = JSON.parse(fs.readFileSync('./credentials/google.json')).API_KEY;
const GEOCODE_API_URL = `https://maps.googleapis.com/maps/api/geocode/json`;

// load database config
let mongoUrl;
if (ENVIRONMENT === 'production') {
  const dbConfig = JSON.parse(fs.readFileSync('./credentials/mongodb.json'));
  const DB_HOST = dbConfig.DB_HOST;
  const DB_USER = dbConfig.DB_USER;
  const DB_PASS = dbConfig.DB_PASS;
  const DB_NAME = dbConfig.DB_NAME;

  mongoUrl = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`;
} else {
  const DB_HOST = process.env.DB_HOST;
  const DB_PORT = process.env.DB_PORT;
  const DB_USER = process.env.DB_USER;
  const DB_PASS = process.env.DB_PASS;
  const DB_NAME = process.env.DB_NAME;

  mongoUrl = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
}

// configure mongoose settings
mongoose.set('useFindAndModify', false);
const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

/*
 * getCoordinates queries the db to get a list of all location info without coordinate information
 * and then hits Google's Geocoding API and adds the coordinate info returned to the database.
 */
async function getCoordinates() {
  // connect to database
  try {
    console.log(`Database URL: ${mongoUrl}`);
    await mongoose.connect(mongoUrl, mongooseConfig);
    console.log('connected to database');
  } catch (err) {
    console.error(chalk.red(`connection error: ${err}`));
  }

  // get list of all locations without coordinate information from database
  let locations;
  let numLocations;
  let numLocationsProcessed = 0;
  try {
    locations = await Location.getNoGeocodeResultLocations();
  } catch (err) {
    console.error(chalk.red(`something wen't wrong getting locations from db\n${err}`));
  }
  numLocations = locations.length;

  console.log(`getting geocode result for ${numLocations} locations`);

  // for each location, hit geocoding API to get coordinate information and store raw data in database
  const geocodeResultPromises = [];
  for (const location of locations) {
    // stop processing locations until a geocode result promise resolves, and more requests can be made
    if (geocodeResultPromises.length >= MAX_CONCURRENT_REQUESTS) {
      await Promise.race(geocodeResultPromises);
    }

    console.log(`getting geocode result for location: ${location.locationString}`);
    const geocodeResultPromise = getGeocodeResult(location.locationString);
    geocodeResultPromise.then(() => {
      // remove this promise from the geocode results promises pool after it resolves
      geocodeResultPromises.splice(geocodeResultPromises.indexOf(geocodeResultPromise), 1);
    });
    geocodeResultPromises.push(geocodeResultPromise);

    geocodeResultPromise
      .then(async (geocodeResult) => {
        try {
          await addGeocodeResultToDb(location, geocodeResult);
        } catch(err) {
          console.error(chalk.red(`something wen't wrong adding geocode result to database for location ${location.locationString}\n${err}`));
        }

        numLocationsProcessed++;
        console.log(`${numLocationsProcessed}/${numLocations} locations processed`);
      })
      .catch((err) => {
        console.error(chalk.red(`something wen't wrong getting geocode result for location ${location.locationString}\n${err}`));
      });
  }

  await Promise.all(geocodeResultPromises);
}

/*
 * getGeocodeResult queries the google API to get the raw geocode data for the given location object
 * @return: The first geocode result from google or an empty object if no results were returned. null if something wen't wrong
 */
async function getGeocodeResult(locationString) {
  let response;
  try {
    response = await axios(GEOCODE_API_URL, {
      params: {
        key: GEOCODE_API_KEY,
        address: locationString
      }
    });
  } catch (err) {
    console.error(chalk.red(`something wen't wrong getting the geocode data for location: ${locationString}\n${err}`));
    return null;
  }

  if (response.status !== 200) {
    console.error(chalk.red(`got a ${response.status} response when getting geocode data for location: ${locationString}`));
    return null;
  }

  if (response.data.status === 'ZERO_RESULTS') {
    return {}
  }

  if (['OK', 'ZERO_RESULTS'].indexOf(response.data.status) < 0) {
    console.error(chalk.red(`google response has status ${response.data.status} for location: ${locationString}`));
  }

  return response.data.results.length > 0 ? response.data.results[0] : {};
}

/*
 * addGeocodeResultToDb updates the given location object with the given geocode result, and then saves the new object in the database
 */
async function addGeocodeResultToDb(location, geocodeResult) {
  location.geocodeResult = geocodeResult;
  location.markModified('geocodeResult');
  location.save();
}

module.exports.getCoordinates = getCoordinates;
