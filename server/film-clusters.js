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
 * handleGetFilmClustersRequest is a function that can be passed into an express `get` method to handle requests to get film clusters for a given bounds
 * @param req: The request object passed from express. Expected query params are swlat, swlon, nelat, nelon, and zoom (all of which should be floats)
 */
async function handleGetFilmClustersRequest(req, res, next) {
  // if the url parameters aren't valid, respond with a 422
  if (!validateGetFilmClustersParams(req.query)) {
    res.sendStatus(422);
    return;
  }

  // parse the url params a bit
  const bounds = {
    southWest: [+req.query.swlat, +req.query.swlon],
    northEast: [+req.query.nelat, +req.query.nelon]
  }
  const zoomLevel = +req.query.zoom;

  let clusters;

  try {
    clusters = await getFilmClusters(bounds, zoomLevel);
  } catch (err) {
    next(err);
    return;
  }

  res.send(clusters);
}

/*
 * validateGetFilmClustersParams checks that the required params are present, and match what's expected
 * @return: true if the params are valid, false otherwise
 */
function validateGetFilmClustersParams(queryParams) {
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

  return true;
}

/*
 * getFilmClusters queries the database to get the clusters of films given a map bounds and zoom level
 * @param bounds: {southWest: [lat, lon], northEast: [lat, lon]} an object of this format containing the south west coordinate and north east coordinate
 *  of the bounds
 * @param zoom: an integer between 1 (most zoomed out) and 20 (most zoomed in) representing the current zoom level
 *  The higher the zoom value, the less the returned locations are clustered
 */
async function getFilmClusters(bounds, zoom) {
  const southWest = bounds.southWest;
  const northEast = bounds.northEast;

  console.log(`getting location clusters in bounds: [${southWest}:${northEast}] with zoom ${zoom}`);

  const clusterFactor = CLUSTER_FACTORS[zoom];

  // query mongo database to get all clusters in the given boundaries, and the counts of movies for each cluster
  let clusters;
  try {
    console.time(`[${southWest}:${northEast}] mongodb query`)
    clusters = await Location.getClustersInBounds(southWest, northEast, clusterFactor);
    console.timeEnd(`[${southWest}:${northEast}] mongodb query`)
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting film locations in bounds: ${southWest}:${northEast}\n${err}`));
    throw err;
  }

  // find the centroid for each cluster
  clusters.forEach((cluster) => {
    cluster.center = getCoordinatesCenter(cluster.locations.map((location) => location.coordinate));
  });

  console.log(`${clusters.length} clusters found in bounds: [${southWest}:${northEast}]`);

  return clusters;
}

module.exports = {
  handleGetFilmClustersRequest
}
