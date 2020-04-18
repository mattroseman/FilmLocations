const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const { handleGetLocationClustersRequest } = require('./location-clusters.js');
const { handleGetMovieTitlesRequest, isMovieTrieGenerated } = require('./movie-titles.js');
const { handleGetMovieRequest, handleGetTopMoviesRequest } = require('./movie-info.js');

const { connectToDatabase, testDatabaseConnection } = require('../lib/db.js');

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

app.get('/location-clusters', handleGetLocationClustersRequest);

app.get('/movie', handleGetMovieRequest);
app.post('/top-movies', handleGetTopMoviesRequest);

app.get('/movie-titles', handleGetMovieTitlesRequest);

app.get('/healthz', (req, res) => {
  if (!isMovieTrieGenerated()) {
    res.sendStatus(500);
  }

  if (!testDatabaseConnection()) {
    res.sendStatus(500);
  }

  res.sendStatus(200);
});

// START THE EXPRESS APP
const port = process.env.PORT || 5000;
app.listen(port, () => {
  // connect to database once app has started
  connectToDatabase();
});
