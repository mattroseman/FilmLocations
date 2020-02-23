const express = require('express');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');

const connectToDatabase = require('../lib/db.js');
const { Location } = require('../lib/models.js');

const ENVIRONMENT = process.env.ENVIRONMENT;

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
  const southWest = [req.query.swlat, req.query.swlon];
  const northEast = [req.query.nelat, req.query.nelon];

  console.log(`getting location clusters in bounds: ${southWest}:${northEast}`);

  // query mongo database to get all clusters in the given boundaries, and the counts of movies for each cluster
  let locations;
  try {
    locations = await Location.getLocationsInBounds(southWest, northEast)
  } catch (err) {
    console.error(chalk.red(`Something wen't wrong getting film locations in bounds: ${southWest}:${northEast}\n${err}`));
    next(err);
    return;
  }
  res.send(locations.map((location) => {
    return {
      'locationString': location.locationString,
      'locationPoint': [location.locationPoint.coordinates[1], location.locationPoint.coordinates[0]]
    }
  }));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // connect to database
  connectToDatabase();
});
