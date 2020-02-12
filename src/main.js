const { addAllMoviesToDb } = require('./get-movies.js');
const { getLocations } = require('./get-locations.js');

(async () => {
  // await addAllMoviesToDb();
  await getLocations();
})();
