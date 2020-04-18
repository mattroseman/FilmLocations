const chalk = require('chalk');

const { Location } = require('../lib/models.js');
const { getCoordinatesCenter } = require('../lib/utils.js');

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

/*
 * handleGetLocationClustersRequest is a function that can be passed into an express `get` method to handle requests to get film clusters for a given bounds
 * @param req: The request object passed from express. Expected query params are swlat, swlon, nelat, nelon, and zoom (all of which should be floats)
 *    movieId is an optional parameter, and only locations used for the movie with the given id will be returned
 */
async function handleGetLocationClustersRequest(req, res, next) {
  // if the url parameters aren't valid, respond with a 422
  if (!validateGetLocationClustersParams(req.query)) {
    res.sendStatus(422);
    return;
  }

  let clusters;

  // parse the url params a bit
  const bounds = {
    southWest: [+req.query.swlat, +req.query.swlon],
    northEast: [+req.query.nelat, +req.query.nelon]
  }
  const zoomLevel = +req.query.zoom;
  const movieId = req.query.movieId


  try {
    clusters = await getLocationClusters(bounds, zoomLevel, movieId);
  } catch (err) {
    next(err);
    return;
  }

  res.send(clusters);
}

/*
 * validateGetLocationClustersParams checks that the required params are present, and match what's expected
 * @return: true if the params are valid, false otherwise
 */
function validateGetLocationClustersParams(queryParams) {
  if (!('swlat' in queryParams) || isNaN(+queryParams.swlat)) {
    return false;
  }
  if (!('swlon' in queryParams) || isNaN(+queryParams.swlon)) {
    return false;
  }
  if (!('nelat' in queryParams) || isNaN(+queryParams.nelat)) {
    return false;
  }
  if (!('nelon' in queryParams) || isNaN(+queryParams.nelon)) {
    return false;
  }

  if (!('zoom' in queryParams) || isNaN(+queryParams.zoom) || +queryParams.zoom < 1 || +queryParams.zoom > 20) {
    return false;
  }

  // movieId is an optional parameter
  if ('movieId' in queryParams && (queryParams.movieId.length < 1 ||  queryParams.movieId === 'null')) {
    return false;
  }

  return true;
}

/*
 * getLocationClusters queries the database to get the clusters of locations given a map bounds and zoom level
 * @param bounds: {southWest: [lat, lon], northEast: [lat, lon]} an object of this format containing the south west coordinate and north east coordinate
 *  of the bounds
 * @param zoom: an integer between 1 (most zoomed out) and 20 (most zoomed in) representing the current zoom level
 *  The higher the zoom value, the less the returned locations are clustered
 * @param movieId: an optional parameter, if provided, only locations for the movie with this id will be queried
 */
async function getLocationClusters(bounds, zoom, movieId) {
  const southWest = bounds.southWest;
  const northEast = bounds.northEast;

  console.log(
    `getting location clusters in bounds: [${southWest}:${northEast}] with zoom ${zoom}` +
    (movieId !== undefined ? ` for the movie: ${movieId}` : '')
  );

  const clusterFactor = CLUSTER_FACTORS[zoom];

  // query mongo database to get all clusters in the given boundaries, and the counts of movies for each cluster
  let clusters;
  try {
    console.time(`[${southWest}:${northEast}] mongodb query`)
    clusters = await Location.getClustersInBounds(southWest, northEast, clusterFactor, movieId);
    console.timeEnd(`[${southWest}:${northEast}] mongodb query`)
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting film locations in bounds: ${southWest}:${northEast}\n${err}`));
    throw err;
  }

  // find the centroid for each cluster
  clusters.forEach((cluster) => {
    cluster.center = getCoordinatesCenter(cluster.locations.map((location) => location.coordinate));
  });

  console.log(
    `${clusters.length} clusters found in bounds: [${southWest}:${northEast}]` +
    (movieId !== undefined ? ` for the movie: ${movieId}` : '')
  );

  return clusters;
}

module.exports = {
  handleGetLocationClustersRequest
}
