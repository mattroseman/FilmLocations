const express = require('express');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');

const connectToDatabase = require('../lib/db.js');
const { Location } = require('../lib/models.js');
const { getCoordinatesCenter } = require('../lib/utils.js');

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
  const horizontalMargin = Math.abs(northEast[1] - southWest[1]) * .1;
  const verticalMargin = Math.abs(northEast[0] - southWest[0]) * .1;
  try {
    console.time(`[${southWest}:${northEast}] mongodb query`)
    clusters = await Location.getClustersInBounds(southWest, northEast, clusterFactor, horizontalMargin, verticalMargin);
    console.timeEnd(`[${southWest}:${northEast}] mongodb query`)
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting film locations in bounds: ${southWest}:${northEast}\n${err}`));
    next(err);
    return;
  }

  // find the centroid for each cluster
  clusters = clusters.map((cluster) => {
    cluster.center = getCoordinatesCenter(cluster.locations.map((location) => location.coordinate))

    return cluster;
  });

  console.log(`${clusters.length} clusters found in bounds: [${southWest}:${northEast}]`);

  res.send(clusters);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // connect to database
  connectToDatabase();
});
