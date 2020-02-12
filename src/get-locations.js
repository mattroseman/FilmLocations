const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const { Movie, Location } = require('./models.js');

// load database environment variables
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

// config mongoose
mongoose.set('useFindAndModify', false);
const mongoUrl = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;

const MAX_CONCURRENT_REQUESTS = process.env.MAX_CONCURRENT_REQUESTS;

/*
 * getLocations queries the database to get a list of all movies, and scrapes the location info for each one
 * adding those locations to the location collection
 */
async function getLocations() {
  // connect to database
  try {
    await mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    console.log('connected to database');
  } catch (err) {
    console.error('connection error: ' + err);
  }

  // query DB to get list of movies
  const movieIds = await Movie.getAllIds();

  console.log(`There are ${movieIds.length} movies in the database`);

  // asynchronously scrape IMDb for each movie, and then add those locations to the database
  let numMoviesProcessed = 0;
  const scrapingPromises = [];
  for (const movieId of movieIds) {
    if (scrapingPromises.length >= MAX_CONCURRENT_REQUESTS) {
      await Promise.race(scrapingPromises);
    }

    const scrapingPromise = scrapeLocations(movieId);
    scrapingPromise.then(() => {
      scrapingPromises.splice(scrapingPromises.indexOf(scrapingPromise), 1);
    });
    scrapingPromises.push(scrapingPromise);

    scrapingPromise
      .then(async (locations) => {
        console.log(`movie: ${movieId} locations: ["${locations.join('", "')}"]`);

        if (locations.length > 0) {
          try {
            const movie = await Movie.findOne({ _id: movieId });
            await addLocationsToDb(locations, movie);
          } catch(err) {
            console.error(`Something wen't wrong adding locations to database for movie: ${movieId}\n${err}`);
          }
        }

        numMoviesProcessed++;
        console.log(`${numMoviesProcessed}/${movieIds.length} movies processed`);
      })
      .catch((err) => {
        console.error(`Something wen't wrong scraping location info for movie: ${movieId}\n${err}`);
      })
  }

  // wait for all requests to finish
  await Promise.all(scrapingPromises);
}

/*
 * scrapeLocations scrapes the IMDb website to get a list of locations a movie was shot in, returning a list of strings
 * @param movieId: the IMDb id of the movie to get locations for
 * @return: an array of Strings of movie locations that were found
 */
async function scrapeLocations(movieId) {
  let response;

  try {
    response = await axios(`https://www.imdb.com/title/${movieId}/locations`);
  } catch (err) {
    console.error(`Something wen't wrong hitting IMDb locations endpoint for movie: ${movieId}\n${err}`);
    return [];
  }

  if (response.status !== 200) {
    console.error(`got a ${response.status} status code when scraping location for movie: ${movieId}`);
  }

  const locationHtml = response.data;
  const $ = cheerio.load(locationHtml);
  // get all the location links on the page
  const $locationElements = $('#filming_locations dt > a');

  return $locationElements.map((i, el) => {
    // remove whitespace or newlines at beginning or end of the location text
    return $(el).text().trim().replace(/\n/g, '');
  }).get();
}

/*
 * addLocationsToDb adds/updates each of the given locations documents in the database so the movies property includes the given movie's id, and vice versa
 * @param locations: a list of location strings
 * @param movie: a mongoose Movie object
 */
async function addLocationsToDb(locations, movie) {
  for (const locationString of locations) {
    let location = await Location.findOne({ locationString });

    // if there isn't already a location document in the database, create it
    if (!location) {
      location = new Location({
        locationString
      });
    }

    // add the location id to the movie's location property
    if (!movie.locations.includes(location._id)) {
      movie.locations.push(location._id);
    }

    // add the movie id to the location's movies property
    if (!location.movies.includes(movie._id)) {
      location.movies.push(movie._id);
    }

    location.save();
  }

  movie.save();
}

module.exports = {
  getLocations
}
