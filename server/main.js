const express = require('express');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');

const connectToDatabase = require('../lib/db.js');
const { Location } = require('../lib/models.js');
const { getCoordinatesCenter, getDistance } = require('../lib/utils.js');

const ENVIRONMENT = process.env.ENVIRONMENT;
const CLUSTER_FACTOR = 3;  // the higher CLUSTER_FACTOR is smaller clusters are likely to be, and there will be more

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

  console.log(`getting location clusters in bounds: [${southWest}:${northEast}]`);

  let clusterFactor = CLUSTER_FACTOR;
  const diagonalDist = getDistance(southWest, northEast);
  console.log(diagonalDist);
  if (diagonalDist >= 20 && diagonalDist < 1000)  {
    clusterFactor += 1;
  }
  if (diagonalDist > 1000) {
    clusterFactor -= 1;
  }

  // query mongo database to get all clusters in the given boundaries, and the counts of movies for each cluster
  let clusters;
  try {
    clusters = await Location.getClustersInBounds(southWest, northEast, clusterFactor);
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

  // filter out clusters not within the given bounds
  // const boundryMargin = horizontalDiff * .05;  // allow for clusters on the edge to still show
  const boundryMargin = diagonalDist * .01;
  clusters = clusters.filter((cluster) => {
    return (
      (cluster.center[0] > southWest[0] - boundryMargin && cluster.center[0] < northEast[0] + boundryMargin) &&
      (cluster.center[1]  > southWest[1] - boundryMargin && cluster.center[1] < northEast[1] + boundryMargin)
    );
  });

  console.log(`${clusters.length} clusters found in bounds: [${southWest}:${northEast}]`);

  res.send(clusters);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // connect to database
  connectToDatabase();
});
