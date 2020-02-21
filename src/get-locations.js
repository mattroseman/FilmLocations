const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');

const { Movie, Location } = require('./models.js');

const RELEVANT_MOVIE_VOTE_MIN = +process.env.RELEVANT_MOVIE_VOTE_MIN

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
  // const movieIds = await Movie.getAllIds();
  const movieIds = await Movie.getAllRelevantIds(RELEVANT_MOVIE_VOTE_MIN);
  const totalMovieCount = movieIds.length;

  console.log(`There are ${totalMovieCount} movies in the database`);

  // asynchronously scrape IMDb for each movie, and then add those locations to the database
  let numMoviesProcessed = totalMovieCount - movieIds.length;
  const scrapingPromises = [];
  for (const movieId of movieIds) {
    // stop processing movies until a scraping promise resolves, and more requests can be made
    if (scrapingPromises.length >= MAX_CONCURRENT_REQUESTS) {
      await Promise.race(scrapingPromises);
    }

    const scrapingPromise = scrapeLocations(movieId);
    scrapingPromise.then(() => {
      // remove this promise from the scrapingPromises pool after it resolves
      scrapingPromises.splice(scrapingPromises.indexOf(scrapingPromise), 1);
    });
    scrapingPromises.push(scrapingPromise);

    scrapingPromise
      .then(async (locations) => {
        if (locations !== null) {
          console.log(`movie: ${movieId} locations: ["${locations.join('", "')}"]`);

          try {
            const movie = await Movie.findOne({ _id: movieId });
            await addLocationsToDb(locations, movie);
          } catch(err) {
            console.error(chalk.red(`Something wen't wrong adding locations to database for movie: ${movieId}\n${err}`));
          }
        }

        numMoviesProcessed++;
        console.log(`${numMoviesProcessed}/${totalMovieCount} movies processed`);
      })
      .catch((err) => {
        console.error(chalk.red(`Something wen't wrong scraping location info for movie: ${movieId}\n${err}`));
      })
  }

  // wait for all requests to finish
  await Promise.all(scrapingPromises);
}

/*
 * scrapeLocations scrapes the IMDb website to get a list of locations a movie was shot in, returning a list of strings
 * @param movieId: the IMDb id of the movie to get locations for
 * @return: an array of Strings of movie locations that were found, or null if something wen't wrong. (If the scrape is successful but no locations is found an empty array is returned)
 */
async function scrapeLocations(movieId) {
  let response;

  try {
    response = await axios(`https://www.imdb.com/title/${movieId}/locations`);
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong hitting IMDb locations endpoint for movie: ${movieId}\n${err}`));
    return null;
  }

  if (response.status !== 200) {
    console.error(chalk.red(`got a ${response.status} status code when scraping location for movie: ${movieId}`));
    return null;
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

  movie.lastLocationUpdateDate = Date.now();
  movie.save();
}

module.exports = {
  getLocations
}
