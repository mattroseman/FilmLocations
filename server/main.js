const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');
const escapeStringRegexp = require('escape-string-regexp');

const { handleGetFilmClustersRequest } = require('./film-clusters.js');
const { handleGetMovieTitlesRequest } = require('./movie-titles.js');

const connectToDatabase = require('../lib/db.js');
const { Movie } = require('../lib/models.js');

const ENVIRONMENT = process.env.ENVIRONMENT;
let app = express();

if (ENVIRONMENT !== 'production') {
  app.all('*', cors());
}

// SETUP PUBLIC FILES
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use(express.static(path.join(__dirname, '../client/public')));

// SETUP MIDDLEWARE
app.use(bodyParser.urlencoded({ limit: '5mb', extended: false }));
app.use(bodyParser.json({ limit: '5mb' }));

// SETUP PATHS
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

app.get('/film-clusters', handleGetFilmClustersRequest);

app.get('/movie', async (req, res, next) => {
  // TODO sanitize this data
  const movieId = req.query.id;
  let movieTitle = req.query.title;

  let query;
  if (movieId && movieId !== 'null') {
    console.log(`getting movie info for movie with id: ${movieId}`);
    query = {_id: movieId};
  } else if (movieTitle && movieTitle !== 'null') {
    console.log(`getting movie info for movie with title: ${movieTitle}`);
    movieTitle = movieTitle.replace(/\(.*?\)$/, '').trim();
    movieTitle = escapeStringRegexp(movieTitle);
    query = {title: {$regex: new RegExp(`^${movieTitle}$`, 'i')}};
  } else {
    // missing required url parameters
    res.sendStatus(422);
    return;
  }

  let movie;
  try {
    movie = await Movie.find(query).sort('-numVotes').limit(1).populate('locations.locationId');
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting movie with title: ${movieTitle} or id: ${movieId}\n${err}`));
    next(err);
    return;
  }

  if (movie.length === 0) {
    res.send({
      success: false,
      movie: null
    });
    return;
  }

  movie = movie[0];

  movie = {
    id: movie._id,
    title: movie.title,
    year: movie.year,
    locations: movie.locations.reduce((uniqueLocations, location) => {
      // if this location was already added to uniqueLocations, simply append to the already existing description
      for (const uniqueLocation of uniqueLocations) {
        if (location.locationId._id === uniqueLocation.id) {
          if (uniqueLocation.description.length > 0 && location.description.length > 0) {
            uniqueLocation.description = `${uniqueLocation.description}, ${location.description}`;
          } else {
            uniqueLocation.description = `${uniqueLocation.description}${location.description}`;
          }

          return uniqueLocations;
        }
      }

      // add this location to uniqueLocations, and convert it to more readable object for frontend
      return [...uniqueLocations, {
        id: location.locationId._id,
        description: location.description,
        locationString: location.locationId.locationString,
        geohash: location.locationId.geohash,
        point: location.locationId.locationPoint !== undefined ? location.locationId.locationPoint.coordinates.reverse() : null
      }]
    }, [])
  }

  res.send({
    success: true,
    movie: movie
  });
});

app.post('/top-movies', async (req, res, next) => {
  const movieIds = req.body.movieIds;
  const offset = +req.body.offset;
  const limit = +req.body.limit;

  console.log(`getting top movies from ${offset} to ${offset + limit} out of ${movieIds.length} total movies`);

  let topMovies
  try {
    topMovies = await Movie.getTopMovies(movieIds, limit, offset);
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting top ${limit} movies out of ${movieIds.length} ids`));
    next(err);
    return;
  }

  console.log(`got top ${topMovies.length} movies out of ${movieIds.length}`);

  res.send(topMovies);
});

app.get('/movie-titles', handleGetMovieTitlesRequest);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // connect to database
  connectToDatabase();
});
