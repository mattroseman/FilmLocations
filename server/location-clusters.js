const { promisify } = require('util');

const chalk = require('chalk');
const geohash = require('ngeohash');
const redis = require('redis');

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

// configure Redis
const REDIS_HOST = process.env.CACHE_HOST;
const REDIS_PORT = process.env.CACHE_PORT;
const redisClient = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
redis.Multi.prototype.execAsync = promisify(redis.Multi.prototype.exec);

redisClient.on('error', (err) => {
  console.error(err);
});
redisClient.on('ready', () => {
  console.log('connected to redis');
});

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

  // get a list of geohashes that encompass the given bounds at the given zoom level
  const geohashes = geohash.bboxes(...southWest, ...northEast, clusterFactor);
  let cachedGeohashes = new Set();
  let uncachedGeohashes = new Set(geohashes);
  let cachedClusters = {}

  let clusters = [];

  // if the clusterFactor is small enough (zoomed enough out) check cache for any clusters previously queried for 
  if (clusterFactor <= 5) {
    cachedClusters = await getCachedClusters(geohashes, clusterFactor, movieId);

    // get the geohashes that had a cached cluster value
    cachedGeohashes = new Set(Object.entries(cachedClusters)
      .filter(([, cluster]) => cluster !== null)
      .map(([geohash,]) => geohash));

    // get the geohashes that didn't have a cached cluster value
    uncachedGeohashes = new Set(Object.entries(cachedClusters)
      .filter(([, cluster]) => cluster === null)
      .map(([geohash,]) => geohash));

    // update cachedClusters to not inlclude empty clusters, or clusters that weren't found in cache
    for (const [geohash, cluster] of Object.entries(cachedClusters)) {
      if (cluster === null || cluster.id === undefined) {
        delete cachedClusters[geohash];
      }
    }

    // if all the clusters were in cache, no DB query needs to happen
    if (cachedGeohashes.size === geohashes.length) {
      console.log(`all ${geohashes.length} were found in cache, no DB query needed`);

      return Object.values(cachedClusters);
    }

    // query mongo database to get all clusters for any uncached geohashes
    try {
      clusters = await Location.getClustersForGeohashes(Array.from(uncachedGeohashes), clusterFactor, movieId);
    } catch (err) {
      console.error(chalk.red(`something went wrong getting clusters for geohashes: ${Array.from(uncachedGeohashes)}\n${err}`));
      throw err;
    }
  } else {
    // if the clusterFactor is too large (too zoomed in) get location clusters using the given bounds instead of geohashes
    try {
      clusters = await Location.getClustersInBounds(southWest, northEast, clusterFactor, movieId);
    } catch (err) {
      console.error(chalk.red(`something went wrong getting clusters in bounds: ${southWest}:${northEast}\n${err}`));
      throw err;
    }
  }

  // get the centers of all the clusters
  for (const cluster of clusters) {
    cluster.center = getCoordinatesCenter(cluster.locations.map((location) => location.coordinate));
  }

  clusters = [...clusters, ...Object.values(cachedClusters)];

  // if the clusterFactor is small enough (zoomed enough out) set the cache values for the results
  if (clusterFactor <= 5) {
    setCachedClusters(clusters, clusterFactor, movieId);

    // get the list of geohashes that don't have cluster data and are therefore empty
    const emptyGeohashes = geohashes.filter((geohash) => {
      for (const cluster of clusters) {
        if (cluster.id === geohash) {
          return false;
        }
      }

      return true;
    });

    setCachedEmptyClusters(emptyGeohashes, clusterFactor, movieId);
  }

  // remove clusters whos center is outside of the given bounds (intentionally done after cacheing as to not waste the query)
  clusters = clusters.filter((cluster) => {
    return (
      cluster.center[0] > southWest[0] && cluster.center[1] > southWest[1] &&
      cluster.center[0] < northEast[0] && cluster.center[1] < northEast[1]
    );
  });

  console.log(
    `${clusters.length} clusters found in bounds: [${southWest}:${northEast}]` +
    (movieId !== undefined ? ` for the movie: ${movieId}` : '')
  );

  return clusters;
}

/*
 * getCachedClusters takes an array of geohashes, anc checks to cache to see if any clusters are already stored there
 * @param geohashes: an array of strings, each representing
 * @return: an object with geohashes as keys, and the cached clusters as values (or null if no cached cluster was found)
 */
async function getCachedClusters(geohashes=[], clusterFactor=4, movieId=null) {
  // if geohashes is undefined or an empty array
  if (!geohashes || geohashes.length <= 0) {
    return [];
  }

  const cachePrefix = `clusters_${clusterFactor}` + (movieId == null ? '' : movieId);

  let cachedClusters = [];
  const result = {};

  try {
    cachedClusters = await redisClient.batch(
      geohashes.map((geohash) => {
        return ['get', `${cachePrefix}_${geohash}`];
      })
    ).execAsync();
  } catch (err) {
    console.error(chalk.red(`something went wrong getting cached clusters\n${err}`));
  }

  // combine array of geohashes, and cache results into an object with the geohashes as keys and clusters as values
  for (const i in geohashes) {
    // parse the JSON string that was cached
    result[geohashes[i]] = JSON.parse(cachedClusters[i]);
  }

  return result; 
}

/*
 * setCachedClusters takes an array of clusters and sets them all in the cache
 * @param clusters: an array of cluster objects
 * @param clusterFactor: used when generating cache key
 * @param movieId: used when generating cache key
 */
async function setCachedClusters(clusters=[], clusterFactor=4, movieId=null) {
  const cachePrefix = `clusters_${clusterFactor}` + (movieId == null ? '' : movieId);

  try {
    await redisClient.batch(
      clusters.map((cluster) => {
        return ['set', `${cachePrefix}_${cluster.id}`, JSON.stringify(cluster)];
      })
    ).execAsync();
  } catch (err) {
    console.error(chalk.red(`something went wrong setting cached clusters\n${err}`));
  }

  return;
}

/*
 * setCachedEmptyClusters takes an array of geohashes that don't have cluster data and cacheds an empty object
 * @param geohashes: an array of strings for each geohash with no cluster data
 * @param clusterFactor: used when generating cache key
 * @param movieId: used when generating cache key
 */
async function setCachedEmptyClusters(geohashes=[], clusterFactor=4, movieId=null) {
  const cachePrefix = `clusters_${clusterFactor}` + (movieId == null ? '' : movieId);

  try {
    await redisClient.batch(
      geohashes.map((geohash) => {
        return ['set', `${cachePrefix}_${geohash}`, '{}'];
      })
    ).execAsync();
  } catch (err) {
    console.error(chalk.red(`something went wrong setting cached empty clusters\n${err}`));
  }

  return;
}

module.exports = {
  handleGetLocationClustersRequest
}
