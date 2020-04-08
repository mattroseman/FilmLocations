const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios');
const geohash = require('ngeohash');

const { connectToDatabase } = require('../lib/db.js');
const { Location } = require('../lib/models.js');

const MAX_CONCURRENT_REQUESTS = +process.env.MAX_CONCURRENT_REQUESTS;

// load geocode API config
const GEOCODE_API_KEY = JSON.parse(fs.readFileSync('./credentials/google.json')).API_KEY;
const GEOCODE_API_URL = `https://maps.googleapis.com/maps/api/geocode/json`;

/*
 * getCoordinates queries the db to get a list of all location info without coordinate information
 * and then hits Google's Geocoding API and adds the coordinate info returned to the database.
 */
async function getCoordinates() {
  // connect to database
  if (!(await connectToDatabase())) {
    return;
  }

  // get list of all locations from database that are missing coordinate data
  let locations;
  let numLocations;
  let numLocationsProcessed = 0;
  try {
    locations = await Location.getNoCoordinateLocations();
  } catch (err) {
    console.error(chalk.red(`something wen't wrong getting locations from db\n${err}`));
  }
  numLocations = locations.length;

  console.log(`getting geocode result for ${numLocations} locations`);

  // for each location, if it doesn't already have geocoding results,
  // hit the geocoding API to get coordinate information and store raw data in database
  const geocodeResultPromises = [];
  for (const location of locations) {
    // skip any locations that already have geocode results
    if (location.geocodeResult !== undefined) {
      continue;
    }

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

  console.log('Done updating any missing geocoding results for locations');
  console.log('Parsing results to get coordinates and geohashes');

  numLocationsProcessed = 0;
  for (const location of locations) {
    numLocationsProcessed++;

    // skip any locations missing geocode results
    if (location.geocodeResult === {} || !location.geocodeResult) {
      console.log(`${numLocationsProcessed}/${numLocations} location ${location.locationString} has no geocode result`);
      continue;
    }

    // if this location geocode result doesn't have coordinate information
    if (location.geocodeResult.geometry === undefined || location.geocodeResult.geometry.location === undefined) {
      console.log(`${numLocationsProcessed}/${numLocations} location ${location.locationString} geocode result doesn't have coordinate info`);
      continue;
    }

    /*
    // skip any locations that already have a locationPoint field
    if (location.locationPoint !== null) {
      console.log(`${numLocationsProcessed}/${numLocations} location ${location.locationString} already has parsed location point`);
      continue;
    }
    */

    if (!location.locationPoint) {
      location.locationPoint = {
        type: 'Point',
        coordinates: [
          location.geocodeResult.geometry.location.lng,
          location.geocodeResult.geometry.location.lat
        ]
      };

      console.log(`${numLocationsProcessed}/${numLocations} location ${location.locationString} is at [${location.locationPoint.coordinates[0]}, ${location.locationPoint.coordinates[1]}]`);
    }

    if (!location.geohash) {
      location.geohash = geohash.encode(location.locationPoint.coordinates[1], location.locationPoint.coordinates[0]);
      location.geohashPrefixes = {
        9: location.geohash.slice(0, 9),
        8: location.geohash.slice(0, 8),
        7: location.geohash.slice(0, 7),
        6: location.geohash.slice(0, 6),
        5: location.geohash.slice(0, 5),
        4: location.geohash.slice(0, 4),
        3: location.geohash.slice(0, 3),
        2: location.geohash.slice(0, 2),
        1: location.geohash.slice(0, 1),
      };
      console.log(`${numLocationsProcessed}/${numLocations} location ${location.locationString} has geohash: ${location.geohash}`);
    }


    await location.save();
  }
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

  location.locationPoint = {
    type: 'Point',
    coordinates: [
      location.geocodeResult.geometry.location.lng,
      location.geocodeResult.geometry.location.lat
    ]
  };

  await location.save();
}

module.exports.getCoordinates = getCoordinates;
