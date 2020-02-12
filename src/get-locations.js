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
// TODO might not need this
// const DB_BULK_OP_MAX_SIZE = process.env.DB_BULK_OP_MAX_SIZE;

// config mongoose
mongoose.set('useFindAndModify', false);
const mongoUrl = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;

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

  for (const movieId of movieIds) {
    console.log(`locations for movie: ${movieId}`);

    debugger;

    let response;
    try {
      response = await axios(`https://www.imdb.com/title/${movieId}/locations`);
    } catch (err) {
      console.error(`Something wen't wrong scraping location info for movie: ${movieId}\n${err}`);
    }

    if (response.status !== 200) {
      console.error(`got a ${response.status} status code when scraping location for movie: ${movieId}`);
    }

    const locationHtml = response.data;
    const $ = cheerio.load(locationHtml);
    const $locationElements = $('#filming_locations dt > a');

    if ($locationElements.length > 0) {
      $locationElements.each((i, el) => {console.log($(el).text())});
    }
  }
}

module.exports = {
  getLocations
}
