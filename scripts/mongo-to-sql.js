const chalk = require('chalk');
const { Client } = require('pg');

const { connectToDatabase } = require('../lib/db.js');
const { Movie, Location } = require('../lib/models.js');


// Connect to SQL db
const SQL_HOST = process.env.SQL_HOST;
const SQL_PORT = process.env.SQL_PORT;
const SQL_USER = process.env.SQL_USER;
const SQL_PASS = process.env.SQL_PASS;
const SQL_NAME = process.env.SQL_NAME;
const sqlClient = new Client({
  host: SQL_HOST,
  port: SQL_PORT,
  user: SQL_USER,
  password: SQL_PASS,
  database: SQL_NAME
});

async function migrateData() {
  // get all movies Ids from mongo
  const movieIds = await Movie.find().distinct('_id');
  let alreadyAddedIds = new Set();
  try {
    const queryResult = await sqlClient.query(`
      SELECT id FROM Movie
    `)
    alreadyAddedIds = new Set(queryResult.rows.map((row) => row.id));
  } catch (err) {
    console.error(chalk.red(`something went wrong getting list of existing movie ids from SQL\n${err}`));
    return;
  }

  let moviesProcessed = alreadyAddedIds.size;

  console.log(`${moviesProcessed}/${movieIds.length} movies already processed`);

  for (const movieId of movieIds) {
    if (alreadyAddedIds.has(movieId)) {
      continue;
    }

    // get the full movie info
    const movie = await Movie.findOne({'_id': movieId});

    // add this movie to the movie table
    try {
      await sqlClient.query(
        `
        INSERT INTO Movie
        (id, title, year, num_votes, rating)
        VALUES ($1, $2, $3, $4, $5)
        `, 
        [
          movie._id,
          movie.title,
          movie.year,
          movie.numVotes,
          movie.rating
        ]
      );
    } catch (err) {
      console.error(chalk.red(`something went wrong adding movie: ${movie._id} to SQL\n${err}`));
      return;
    }

    // for each location of that movie query the location data
    for (let movieLocation of movie.locations) {
      location = await Location.findOne({'_id': movieLocation.locationId});

      if (location === null) {
        console.log(`movie had a location id: ${movieLocation.locationId} that doesn't exist in the database`);
        continue;
      }

      // add this location to the location table
      try {
        await sqlClient.query(
          `
          INSERT INTO Location
          (id, location_string, geocode_result, coordinate, geohash)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
          `,
          [
            location._id.toString(),
            location.locationString,
            location.geocodeResult ? JSON.stringify(location.geocodeResult) : null,
            location.locationPoint != undefined ? `(${location.locationPoint.coordinates.join(', ')})` : null,
            location.geohash
          ]
        );
      } catch (err) {
        console.error(chalk.red(`something went wrong adding Location: ${location._id} to SQL\n${err}`));
        return;
      }

      // add a relation to MovieLocations between the current movie and current location
      let description = null;
      if (location.description != null && location.description.length > 0) {
        description = location.description;
      }
      if (movieLocation.description != null && movieLocation.description.length > 0) {
        description = movieLocation.description;
      }

      try {
        await sqlClient.query(
          `
          INSERT INTO MovieLocation
          (movie, location, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (movie, location) DO NOTHING
          `,
          [
            movie._id,
            location._id.toString(),
            description
          ]
        );
      } catch (err) {
        console.error(chalk.red(`something went wrong adding movie locations relation for movie: ${movie._id} and location: ${location._id}\n${err}`));
        return;
      }
    }

    moviesProcessed++;
    console.log(`${moviesProcessed}/${movieIds.length} processed`);
  }
}

sqlClient.connect()
  .then(connectToDatabase)
  .then(migrateData)
  .then(() => sqlClient.end())
  .catch((err) => console.error(err));
