const chalk = require('chalk');
const escapeStringRegexp = require('escape-string-regexp');

const { Movie } = require('../lib/models.js');

// CONSTANTS
const DEFAULT_TOP_MOVIES_OFFSET = 0;
const DEFAULT_TOP_MOVIES_LIMIT = 20;

/*
 * handleGetMoviesRequest is a function that can be passed into an express `get` method to handle requests to get a movie with a given title or id.
 * @param req: The request object passed from express. Expected query params are id or title. One of these must be provided or a 422 response will be sent.
 */
async function handleGetMovieRequest(req, res, next) {
  // if the url parameters aren't valid, respond with a 422
  if (!validateGetMovieRequestParams(req.query)) {
    res.sendStatus(422);
    return;
  }

  // TODO sanitize this data for mongodb query
  const movieId = req.query.id;
  let movieTitle = req.query.title;

  let movie;
  try {
    movie = await getMovie(movieId, movieTitle);
  } catch (err) {
    next(err);
    return;
  }

  if (movie === null) {
    res.send({
      success: false,
      movie: null
    });
  } else {
    res.send({
      success: true,
      movie
    });
  }
}

/*
 * validateGetMovieRequestParams checks that the required params are present, and match what's expected
 * @return: true if the params are valid, false otherwise
 */
function validateGetMovieRequestParams(queryParams) {
  // if there isn't an id OR title parameter return false
  if (
    (!('id' in queryParams) || queryParams.id.length < 1 || queryParams.id === 'null') &&
    (!('title' in queryParams) || queryParams.title.length < 1 || queryParams.title === 'null')
  ) {
    return false;
  }

  return true;
}

/*
 * getMovie queries for a movie with the given id, and title.
 * @return: an object of the following format containing relevant movie info
 * {
 *  'id': <movie id>,
 *  'title': <movie title>,
 *  'year': <movie year>,
 *  'locations': [
 *    {
 *      'id': <location id>,
 *      'description': <description of this location specific to the parent movie>,
 *      'locationString': <name of this location>,
 *      'geohash': <geohash of location coordinate>,
 *      'point': [<lat>, <lon>]
 *    },
 *    ...
 *  ]
 * }
 */
async function getMovie(id=null, title=null) {
  if (id === null && title === null) {
    return null;
  }

  let query;
  if (id && id !== 'null') {
    console.log(`getting movie info for movie with id: ${id}`);
    query = {_id: id};
  } else {
    console.log(`getting movie info for movie with title: ${title}`);

    // remove parenthesis that end the movie title
    title = title.replace(/\(.*?\)\s*$/, '').trim();
    // escape any characters in the movie title that clash with special regex characters
    title = escapeStringRegexp(title);
    // query for movie titles that match this title, ignoring case
    query = {title: {$regex: new RegExp(`^${title}$`, 'i')}};
  }

  let movie;
  try {
    movie = await Movie.find(query).sort('-numVotes').limit(1).populate('locations.locationId');
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting movie with title: ${title} or id: ${id}\n${err}`));
    throw err;
  }

  if (movie.length === 0) {
    return null;
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

  return movie;
}

/*
 * handleGetTopMoviesRequest is a function that can be passed into an express `get` method to handle requests to get top movies
 * that are in a given list of geohashes
 * @param req: The request object passed from express. Expected query params are geohashes as a comma seperated string of geohashes
 *  Optional params in request body are `offset` which will get top movies after the given number of top movies, and `limit` which determines how many top movies are returned.
 */
async function handleGetTopMoviesRequest(req, res, next) {
  // if the request body parameters aren't valid, respond with a 422
  if (!validateGetTopMoviesParams(req.query)) {
    res.sendStatus(422);
    return;
  }

  const geohashes = req.query.geohashes.split(',').filter(geohash => geohash.length > 0);
  const offset = 'offset' in req.body ? +req.body.offset : DEFAULT_TOP_MOVIES_OFFSET;
  const limit = 'limit' in req.body ? +req.body.limit : DEFAULT_TOP_MOVIES_LIMIT;

  console.log(`getting top movies from ${offset} to ${offset + limit} within ${geohashes.length} geohash(es)`);

  let topMovies
  try {
    topMovies = await Movie.getTopMovies(geohashes, limit, offset);
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting top ${limit} movies out of ${geohashes.length} ids`));
    next(err);
    return;
  }

  console.log(`got top ${topMovies.length} movies within ${geohashes.length} geohash(es)`);

  res.send(topMovies);
}

/*
 * validateGetTopMoviesParams checks that the required params are present, and if required/optional params match what's expected
 * @return: true if the params are valid, false otherwise
 */
function validateGetTopMoviesParams(queryParams) {
  // check that geohashes is in query params, and that there is at least one geohash in the comma seperated list
  if (!('geohashes' in queryParams) || queryParams.geohashes.split(',').filter(geohash => geohash.length > 0).length <= 0) {
    return false;
  }

  // check that all the geohashes have the same length
  const geohashLength = queryParams.geohashes[0].length;
  for (const geohash of queryParams.geohashes) {
    if (geohash.length !== geohashLength) {
      return false;
    }
  }

  // offset is not required, but if present must be a number
  if (('offset' in queryParams) && isNaN(+queryParams.offset)) {
    return false;
  }

  // limit is not required, but if present must be a number
  if (('limit' in queryParams) && isNaN(+queryParams.offset)) {
    return false;
  }

  return true;
}

module.exports = {
  handleGetMovieRequest,
  handleGetTopMoviesRequest
}
