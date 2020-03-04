const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');

const connectToDatabase = require('../lib/db.js');
const { Movie, Location } = require('../lib/models.js');

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
  // const movieIds = await Movie.getAllRelevantIds(RELEVANT_MOVIE_VOTE_MIN);
  const movieIds = await Movie.getAllMovieIdsWithLocations();
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
          console.log(`movie: ${movieId} locations: ["${locations.map((location) => {return location.locationString}).join('", "')}"]`);

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

/*
 * addLocationsToDb adds/updates each of the given locations documents in the database so the movies property includes the given movie's id, and vice versa
 * @param locations: a list of location strings
 * @param movie: a mongoose Movie object
 */
async function addLocationsToDb(locations, movie) {
  for (const locationData of locations) {
    const locationString = locationData.locationString;
    let location = await Location.findOne({ locationString });

    // if there isn't already a location document in the database, create it
    if (!location) {
      location = new Location({
        locationString
      });
    }

    if (movie.newLocations.map((newLocation) => newLocation.locationId).indexOf(location._id) < 0) {
      await Movie.update({'_id': movie._id}, {
        $push: {
          newLocations: {
            locationId: location._id,
            description: locationData.description ? locationData.description : ''
          }
        }
      });
    }

    if (location.newMovies.map((newMovie) => newMovie.movieId).indexOf(movie._id) < 0) {
      await Location.update({'_id': location._id}, {
        $push: {
          newMovies: {
            movieId: movie._id,
            description: locationData.description ? locationData.description : ''
          }
        }
      });
    }
  }

  movie.lastLocationUpdateDate = Date.now();

  await movie.save();
}

module.exports = {
  getLocations
}
