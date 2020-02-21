const mongoose = require('mongoose');
const fs = require('fs');
const zlib = require('zlib');
const https = require('https');
const chalk = require('chalk');

const { Movie } = require('../lib/models.js');

const ENVIRONMENT = process.env.ENVIRONMENT;
const IMDB_BASIC_FILE_URL = 'https://datasets.imdbws.com/title.basics.tsv.gz';
const IMDB_RATING_FILE_URL = 'https://datasets.imdbws.com/title.ratings.tsv.gz';

let preExistingMovieIds;
let movieIds;

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
const DB_BULK_OP_MAX_SIZE = process.env.DB_BULK_OP_MAX_SIZE;

// config mongoose
mongoose.set('useFindAndModify', false);
const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

/*
 * addAllMoviesToDb downloads a list of current movies from IMDb, including data associated with the movies.
 * Then it adds all the movies to mongoDB.
 * @param checkForUpdates: if true will update all preexisting documents in the db.
 */
async function addAllMoviesToDb() {
  const startTime = new Date();

  // connect to database
  try {
    console.log(`Database URL: ${mongoUrl}`);
    await mongoose.connect(mongoUrl, mongooseConfig);
    console.log('connected to database');
  } catch (err) {
    console.error(chalk.red(`connection error: ${err}`));
  }

  preExistingMovieIds = new Set(await Movie.getAllIds());
  console.log(`already ${preExistingMovieIds.size} movies in db`);

  // add movie info to db
  try {
    await addBasicInfoToDb();
  } catch (err) {
    console.error(chalk.red(`there was an error adding basic movie info to db: ${err}`));
  }

  movieIds = new Set(await Movie.getAllIds());

  try {
    await addRatingInfoToDb();
  } catch (err) {
    console.error(chalk.red(`there was an error updating movie rating info in db: ${err}`));
  }

  console.log('All movie data has been downloaded and updated');

  console.log('took: ' + Math.round(new Date() - startTime) / 1000 + 's');
}

/*
 * addBasicInfoToDb downloads the basic info from IMDb, and adds all basic movie info to the database
 */
async function addBasicInfoToDb() {
  console.log('downloading and processing IMDb basics file');

  const startTime = new Date();

  const newMoviesBuffer = [];
  let newMoviesTotalLength = 0;
  const insertionPromises = [];

  let basicInfoLines;
  try {
    basicInfoLines = await downloadZippedFile(IMDB_BASIC_FILE_URL);
  } catch (err) {
    console.error(chalk.red(`error downloading basic info file from IMDb: ${err}`));
  }

  for await (const line of basicInfoLines) {
    const basicInfo = processBasicInfo(line);

    // if this line was successfully processed, add it to the new movies buffer
    if (basicInfo) {
      newMoviesBuffer.push({
        _id: basicInfo.id,
        title: basicInfo.title,
        year: basicInfo.year
      });

      newMoviesTotalLength++;
    }

    // if the buffer is filled up, insert the movies, and flush the buffer
    if (newMoviesBuffer.length >= DB_BULK_OP_MAX_SIZE) {
      try {
        insertionPromises.push(await Movie.collection.insertMany([...newMoviesBuffer], {ordered: false, lean: true}));
        console.log(`adding ${newMoviesBuffer.length} movies to the DB`);
      } catch (err) {
        console.error(chalk.red(`error adding movies to db: ${err}`));
      }

      // reset the buffer for more movies
      newMoviesBuffer.length = 0;
    }
  }

  if (newMoviesTotalLength === 0) {
    console.log('no new movies to add to db');

    return;
  }

  // one final insertMany to clear out newMovies buffer
  try {
    insertionPromises.push(Movie.collection.insertMany([...newMoviesBuffer], {ordered: false, lean: true}));
  } catch (err) {
    console.error(chalk.red(`error adding movies to db: ${err}`));
  }

  console.log(`${newMoviesTotalLength} new documents added`);

  // wait for all the insertions to finish
  await Promise.all(insertionPromises);

  console.log('IMDb basics file downloaded and processed');

  console.log(`${Math.round((new Date() - startTime) / 1000)}s`);
}

/*
 * processBasicInfo takes a line from the IMDb basics info uncompressed download, grabs the relevant data
 * and returns it as an object
 * @param line: a string that's a tab seperated line from IMDb basics file
 * @return: an object that is the relevant data parsed out of the given line, null if the given line isn't a movie
 */
function processBasicInfo(line) {
  const data = line.split('\t');

  // if this isn't a movie
  if (data[1] !== 'movie') {
    return null;
  }

  const id = data[0];
  let title = data[2];
  const year = isFinite(parseInt(data[5])) ? parseInt(data[5]) : null;

  if (preExistingMovieIds.has(id)){
    return null;
  }

  return {
    id,
    title,
    year
  };
}

/*
 * addRatingInfoToDb downloads the rating info from IMDb, and adds all movie rating info to the database
 */
async function addRatingInfoToDb() {
  console.log('downloading and processing IMDb ratings file');

  const startTime = new Date();

  const updateOperations = [];

  let ratingInfoLines;
  try {
    ratingInfoLines = await downloadZippedFile(IMDB_RATING_FILE_URL);
  } catch (err) {
    console.error(chalk.red(`error downloading ratings info file form IMDb: ${err}`));
  }

  for await (const line of ratingInfoLines) {
    const ratingInfo = processRatingInfo(line);

    // if this line was successfully processed, add it to the updateOperations array
    if (ratingInfo) {
      updateOperations.push({
        updateOne: {
          filter: { _id: ratingInfo.id },
          update: { numVotes: ratingInfo.numVotes, rating: ratingInfo.rating }
        }
      });
    }
  }

  if (updateOperations.length === 0) {
    console.log('no new ratings to update in db');

    return;
  }

  // send a bulk update to the db to update all movies with ratings info
  try {
    const res = await Movie.bulkWrite(updateOperations);

    console.log(`${res.modifiedCount} documents updated`);
  } catch (err) {
    console.error(chalk.red(`error updating movies in db: ${err}`));
  }

  console.log('IMDb ratings file downloaded and processed');

  console.log(`${Math.round((new Date() - startTime) / 1000)}s`);
}

/*
 * processRatingInfo takes a line from the IMDb movies ratings info uncompressed download, grabs the relevant data
 * and returns it as an object
 * @param line: a string that's a tab seperated line from IMDb ratings file
 * @return: an object that is the relevant data parsed out of the given line, null if the movie id isn't in the database
 */
function processRatingInfo(line) {
  const data = line.split('\t');
  const id = data[0];
  const rating = isFinite(parseInt(data[1])) ? parseInt(data[1]) : null;
  const numVotes = isFinite(parseInt(data[2])) ? parseInt(data[2]) : null;

  // if there isn't a movie for the current rating in the database, return null
  if (!movieIds.has(id)) {
    return null;
  }

  return {
    id,
    rating,
    numVotes
  };
}

/*
 * downloadZippedFile queries the given url to get a zipped file, unzips it, and yields it line by line
 * @pram url: a string that's the url to get the file at
 * @return: an asyncronous iterable over the lines of the file
 */
async function* downloadZippedFile(url) {
  // download and unzip the basics file
  const unzippedStream = await new Promise((resolve, reject) => {
    const unzip = zlib.createUnzip();

    https.get(url, (res) => {
      resolve(res.pipe(unzip));
    }).on('error', (err) => {
      reject(err);
    });
  });

  // iterate over the unzipped chunks of the stream yielding complete lines
  let previous = '';
  for await (const chunk of unzippedStream) {
    previous += chunk;

    while (true) {
      const eolIndex = previous.indexOf('\n');
      if (eolIndex < 0) {
        break;
      }

      // if eol is in previous, split it and yield everything up to it
      const line = previous.slice(0, eolIndex);
      yield line;

      // then reset previous to everything after the eol
      previous = previous.slice(eolIndex + 1);
    }
  }

  if (previous.length > 0) {
    yield previous;
  }
}

module.exports.addAllMoviesToDb = addAllMoviesToDb;
