const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');

const connectToDatabase = require('../lib/db.js');
const { Location, Movie } = require('../lib/models.js');
const { getCoordinatesCenter } = require('../lib/utils.js');
const MovieTrie = require('../lib/movieTrie.js');

const ENVIRONMENT = process.env.ENVIRONMENT;
// the higher CLUSTER_FACTOR is smaller clusters are likely to be, and there will be more
const CLUSTER_FACTORS = {
  20: 9, 19: 9, 18: 9, 17: 9,
  16: 7,
  15: 6, 14: 6,
  13: 5, 12: 5, 11: 5,
  10: 4, 9: 4,
  8: 3, 7: 3,
  6: 2, 5: 2,
  4: 1, 3: 1, 2: 1, 1: 1
}

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

// LOAD MOVIE TRIE
let movieTrie = new MovieTrie();
movieTrie.generateMovieTrie();

// SETUP PATHS
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

app.get('/film-clusters', async (req, res, next) => {
  const southWest = [+req.query.swlat, +req.query.swlon];
  const northEast = [+req.query.nelat, +req.query.nelon];
  const zoomLevel = +req.query.zoom;

  console.log(`getting location clusters in bounds: [${southWest}:${northEast}] with zoom ${zoomLevel}`);

  const clusterFactor = CLUSTER_FACTORS[zoomLevel];

  // query mongo database to get all clusters in the given boundaries, and the counts of movies for each cluster
  let clusters;
  try {
    console.time(`[${southWest}:${northEast}] mongodb query`)
    clusters = await Location.getClustersInBounds(southWest, northEast, clusterFactor);
    console.timeEnd(`[${southWest}:${northEast}] mongodb query`)
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting film locations in bounds: ${southWest}:${northEast}\n${err}`));
    next(err);
    return;
  }

  // find the centroid for each cluster
  clusters.forEach((cluster) => {
    cluster.center = getCoordinatesCenter(cluster.locations.map((location) => location.coordinate));
  });

  console.log(`${clusters.length} clusters found in bounds: [${southWest}:${northEast}]`);

  res.send(clusters);
});

app.get('/movie', async (req, res, next) => {
  const movieId = req.query.id;
  const movieTitle = req.query.title;

  let query;
  if (movieId && movieId !== 'null') {
    console.log(`getting movie info for movie with id: ${movieId}`);
    query = {_id: movieId};
  } else if (movieTitle && movieTitle !== 'null') {
    console.log(`getting movie info for movie with title: ${movieTitle}`);
    query = {title: {$regex: new RegExp(`^${movieTitle}$`, 'i')}};
  } else {
    // missing required url parameters
    res.sendStatus(422);
    return;
  }

  let movie;
  try {
    movie = await Movie.findOne(query).populate('locations.locationId');
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting movie with title: ${movieTitle} or id: ${movieId}\n${err}`));
    next(err);
    return;
  }

  if (!movie) {
    res.send({
      success: false,
      movie: null
    });
    return;
  }

  /*
  console.log(movie.locations.map((location) => {
    return {
      id: location.locationId._id,
      description: location.description,
      locationString: location.locationId.locationString,
      geohash: location.locationId.geohash,
      point: location.locationId.locationPoint !== undefined ? location.locationId.locationPoint.coordinates.reverse() : null
    }
  }));
  */

  movie = {
    _id: movie._id,
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

app.get('/movie-titles', async (req, res, next) => {
  const prefix = req.query.prefix;

  const cancelToken = {
    cancelled: false
  };

  req.on('close', () => {
    console.log(`movie titles request for prefix: ${prefix} cancelled`);
    cancelToken.cancelled = true;
  });

  console.log(`getting movie titles for prefix: ${prefix}`);

  let movieTitles = [];
  try {
    movieTitles = await movieTrie.getMovieTitlesFromPrefix(prefix, cancelToken);
  } catch (err) {
    if (err === 'getWords cancelled') {
      res.send(movieTitles);
      return;
    }

    console.error(chalk.red(`Something wen't wrong getting movie titles for prefix ${prefix}\n${err}`));
    next(err);
    return;
  }

  console.log(`got ${movieTitles.length} titles for prefix: ${prefix}`);

  res.send(movieTitles);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // connect to database
  connectToDatabase();
});
