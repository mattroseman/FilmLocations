const { connectToDatabase } = require('../lib/db.js');
const { addAllMoviesToDb } = require('./get-movies.js');
const { getLocations } = require('./get-locations.js');
const { getCoordinates } = require('./get-coordinates.js');
const { parsePlaceId } = require('./parse-place-id.js');

if (process.env.ENVIRONMENT === 'production') {
  const express = require('express');

  const PORT = +process.env.PORT || 8080

  const app = express();

  app.get('/', (_, res) => {
    (async () =>  {
      if (!(await connectToDatabase())) {
        return;
      }

      await addAllMoviesToDb();
      await getLocations();
      await getCoordinates();
    })();
    res.send();
  });

  app.listen(PORT);
} else {
    (async () =>  {
      if (!(await connectToDatabase())) {
        return;
      }

      await addAllMoviesToDb();
      await getLocations();
      await getCoordinates();
      await parsePlaceId();
    })();
}
