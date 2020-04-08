const { parentPort } = require('worker_threads');

const { connectToDatabase } = require('../lib/db.js');
const { Movie, Location } = require('../lib/models.js');

connectToDatabase();

parentPort.on('message', async (message) => {
  const locations = message.locations;
  const movieId = message.movieId;

  try {
    const movie = await Movie.findOne({ _id: movieId });
    await addLocationsToDb(locations, movie);
  } catch (err) {
    parentPort.postMessage({
      success: false,
      moiveId: movieId,
      locations: locations,
      error: err
    });
  }

  parentPort.postMessage({
    success: true,
    movieId: movieId,
    locations: locations
  });
});

/*
 * addLocationsToDb adds/updates each of the given locations documents in the database so the movies property includes the given movie's id, and vice versa
 * @param locations: a list of location strings
 * @param movie: a mongoose Movie object
 */
async function addLocationsToDb(locations, movie) {
  for (const locationData of locations) {
    const locationString = locationData.locationString;
    let location = await Location.findOne({ locationString });

    // if there isn't already a location document in the database, create it
    if (!location) {
      location = new Location({
        locationString
      });

      await location.save();
    }

    // if this movie doesn't already have a document in locations for this location
    if (movie.locations.map((movieLocation) => movieLocation.locationId).indexOf(location._id) < 0) {
      await Movie.update({'_id': movie._id}, {
        $push: {
          locations: {
            locationId: location._id,
            description: locationData.description ? locationData.description : ''
          }
        }
      });
    }

    // if this location doesn't already have a document in movies for this movie
    if (location.movies.map((locationMovie) => locationMovie.movieId).indexOf(movie._id) < 0) {
      await Location.update({'_id': location._id}, {
        $push: {
          movies: {
            movieId: movie._id,
            description: locationData.description ? locationData.description : ''
          }
        }
      });
    }
  }

  movie.lastLocationUpdateDate = Date.now();

  await movie.save();
}
