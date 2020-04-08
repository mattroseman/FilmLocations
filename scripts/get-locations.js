const { Worker } = require('worker_threads');

const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');

const { connectToDatabase } = require('../lib/db.js');
const { Movie } = require('../lib/models.js');

const RELEVANT_MOVIE_VOTE_MIN = +process.env.RELEVANT_MOVIE_VOTE_MIN;
const MAX_CONCURRENT_REQUESTS = +process.env.MAX_CONCURRENT_REQUESTS;

/*
 * getLocations queries the database to get a list of all movies, and scrapes the location info for each one
 * adding those locations to the location collection
 */
async function getLocations() {
  // connect to database
  if (!(await connectToDatabase())) {
    return;
  }

  // query DB to get list of movies
  const movieIds = await Movie.getAllRelevantIds(RELEVANT_MOVIE_VOTE_MIN);
  const totalMovieCount = movieIds.length;
  let numMoviesProcessed = 0;

  console.log(`There are ${totalMovieCount} relevant movies in the database`);

  // start worker thread to add data to database
  const worker = new Worker('./scripts/get-locations-worker.js');
  worker.on('message', (message) => {
    // if a worker successfully finishes processing movie and it's locations
    if (message.success) {
      numMoviesProcessed++;
      console.log(`${numMoviesProcessed}/${totalMovieCount} movies processed`);
    } else {
      console.error(chalk.red(`Something wen't wrong adding locations to database for movie: ${message.movieId}\n${message.error}`));
    }
  });

  // asynchronously scrape IMDb for each movie, and then add those locations to the database
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
          console.log(`movie: ${movieId} locations: ["${locations.map((location) => {return location.locationString}).join('", "')}"]`);

          worker.postMessage({
            movieId: movieId,
            locations: locations
          });
        }
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
  const $locationElements = $('#filming_locations > div');

  return $locationElements.map((i, el) => {
    // remove whitespace or newlines at beginning or end of the location text and description
    return {
      locationString: $(el).find('dt > a').text().trim().replace(/\n/g, ''),
      description: $(el).find('dd').text().trim().replace(/\n|^\(|\)$/g, '')
    }
    // return $(el).text().trim().replace(/\n/g, '');
  }).get();
}

module.exports = {
  getLocations
}
