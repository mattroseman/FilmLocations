const { addAllMoviesToDb } = require('./get-movies.js');
const { getLocations } = require('./get-locations.js');
const { getCoordinates } = require('./get-coordinates.js');

if (process.env.ENVIRONMENT === 'production') {
  const express = require('express');

  const PORT = +process.env.PORT || 8080

  const app = express();

  app.get('/', (_, res) => {
    (async () =>  {
      await addAllMoviesToDb();
      await getLocations();
    })();
    res.send();
  });

  app.listen(PORT);
} else {
    (async () =>  {
      await addAllMoviesToDb();
      await getLocations();
      await getCoordinates();
    })();
}
