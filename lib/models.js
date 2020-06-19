const mongoose = require('mongoose');
const geohash = require('ngeohash');

const { getCommonPrefix } = require('../lib/utils.js');


// MOVIE COLLECTION
const movieSchema = new mongoose.Schema({
  _id: String,
  title: {type: String, required: true},
  year: {type: Number, default: 0},
  numVotes: {type: Number, default: 0},
  rating: {type: Number, default: 0},
  locations: [{
    locationId: {type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true},
    description: {type: String, default: ''}
  }],
  lastLocationUpdateDate: Date
});

// create a descending sort index on numVotes
movieSchema.index({numVotes: -1});

// returns a string representation of a Movie for logging purposes
movieSchema.methods.toString = function() {
  return `Movie: (_id: ${this._id}, title: ${this.title}, year: ${this.year}, numVotes: ${this.numVotes}, rating: ${this.rating})`;
};

movieSchema.statics.getCount = async function() {
  return await this.find().distinct('_id').count();
};

/*
 * getAllIds queries for all unique movie id's in the database
 */
movieSchema.statics.getAllIds = async function() {
  return await this.find().distinct('_id');
};

/*
 * getAllRelevantIds queries for all movie ids without location info and with num of votes over the given minimum
 */
movieSchema.statics.getAllRelevantIds = async function(num_votes_min) {
  return await this.find({
    $and: [
      {'numVotes': {$gte: num_votes_min}},
      {'lastLocationUpdateDate': {$exists: false}}
      // {'locations': {$exists: false}},
    ]
  }).distinct('_id');
};

/*
 * getAllMovieIdsWithLocations queries for all movies that have location data
 */
movieSchema.statics.getAllMovieIdsWithLocations = async function() {
  const aggregationPipeline = Movie.aggregate();

  aggregationPipeline.match({
    $and: [
      {locations: {$exists: true}},
      {newLocations: {$exists: true}}
    ]
  });

  aggregationPipeline.project({
    lessNewLocations: {
      $lt: [{$size: '$newLocations'}, {$size: '$locations'}]
    }
  });

  aggregationPipeline.match({
    lessNewLocations: true
  });

  aggregationPipeline.project({
    '_id': 1
  });

  const moviesWithLessNewLocations = await aggregationPipeline.exec();

  return moviesWithLessNewLocations.map((movie) => {
    return movie._id;
  });
};

movieSchema.statics.idExists = async function(id) {
  return await this.exists({_id: id});
};

/*
 * getTopMovies takes a list of geohashes and gets a list of movies within those geohashes, sorted by number of ratings
 * param geohashes: an array of geohashes to search in
 * param numMovies: only return the top <numMovies> movies
 * param offset: return the top movies after this amount
 * return: a sorted list of <numMovies> movie documents
 */
movieSchema.statics.getTopMovies = async function(geohashes=[], numMovies=100, offset=0)  {
  const geohashLength = geohashes[0].length;

  const aggregationPipeline = Location.aggregate();

  /*
  Example mongodb query the below aggregation is based off of
  db.locations.aggregate([
    {$match: {"geohashPrefixes.5": {$exists: true}}},
    {$match: {"geohashPrefixes.5": "dpmuh"}},
    {$unwind: "$movies"},
    {$group: {_id: "$movies.movieId"}},
    {$lookup: {from: "movies", localField: "_id", foreignField: "_id", as: "movie"}},
    {$sort: {"movie.numVotes": 1}},
    {$skip: 1},
    {$limit: 3},
    {$unwind: "$movie"},
    {$unwind: "$movie.locations"},
    {$lookup: {from: "locations", localField: "movie.locations.locationId", foreignField: "_id", as: "movie.locations.locationInfo"}},
    {$unwind: "$movie.locations.locationInfo"},
    {$group: {_id: "$_id", locations: {$push: {description: "$movie.locations.description", locationInfo: "$movie.locations.locationInfo.locationString"}}}}
  ])
  */

  // only get locations that have the required geohash
  aggregationPipeline.match({
    [`geohashPrefixes.${geohashLength}`]: {$exists: true}
  });

  // filter to only those locations that are within one of the given geohashes
  aggregationPipeline.match({
    [`geohashPrefixes.${geohashLength}`]: {
      $in: geohashes
    }
  });

  // unwind location objects so that there is a document for each movie that was looked up
  aggregationPipeline.unwind('movies');

  // group by movie id to dedupe movies, and combine multiple locations into one document
  aggregationPipeline.group({
    _id: '$movies.movieId',
  });

  // lookup the rest of the movie info for each document
  aggregationPipeline.lookup({
    from: 'movies',
    localField: '_id',
    foreignField: '_id',
    as: 'movie'
  });

  // sort movies by number of votes (popularity)
  aggregationPipeline.sort({
    'movie.numVotes': 'descending'
  });

  // apply the offset and numMovies parameters to show the correct "page" of movies
  aggregationPipeline.skip(offset);
  aggregationPipeline.limit(numMovies);

  // since there should only be one movie document from the lookup, unwind movie
  aggregationPipeline.unwind('movie');

  // unwind the array of locations under each movie for the lookup of complete location information
  aggregationPipeline.unwind('movie.locations');

  // lookup complete location information, and unwind since each location will have one document looked up
  aggregationPipeline.lookup({
    from: 'locations',
    localField: 'movie.locations.locationId',
    foreignField: '_id',
    as: 'movie.locations.locationInfo'
  });
  aggregationPipeline.unwind('movie.locations.locationInfo');

  // regroup based on the movie id, and project only relevant location information
  aggregationPipeline.group({
    _id: '$_id',
    title: {$first: '$movie.title'},
    year: {$first: '$movie.year'},
    numVotes: {$first: '$movie.numVotes'},
    locations: {
      $push: {
        id: '$movie.locations.locationId',
        locationString: '$movie.locations.locationInfo.locationString',
        point: {
          $reverseArray: '$movie.locations.locationInfo.locationPoint.coordinates'
        },
        geohash: '$movie.locations.locationInfo.geohash',
        description: '$movie.locations.description'
      }
    }
  });

  // unwinding and grouping messes up the sort, so another sort has to happen
  // (this one is quick because we are only sorting the <numMovies> movies)
  aggregationPipeline.sort({
    numVotes: 'descending'
  });

  aggregationPipeline.project({
    _id: 0,
    id: '$_id',
    title: 1,
    year: 1,
    numVotes: 1,
    locations: 1
  });

  let movies = await aggregationPipeline.exec();

  // remove any duplicate location subobjects (concating any descriptions)
  for (const movie of movies) {
    movie.locations = movie.locations.reduce((uniqueLocations, location) => {
      // if this location was already added to uniqueLocations, simply append to the already existing description
      for (const uniqueLocation of uniqueLocations) {
        if (location.id.toString() == uniqueLocation.id.toString()) {
          if (uniqueLocation.description.length > 0 && location.description.length > 0) {
            uniqueLocation.description = `${uniqueLocation.description}, ${location.description}`;
          } else {
            uniqueLocation.description = `${uniqueLocation.description}${location.description}`;
          }

          return uniqueLocations;
        }
      }

      // if this location isn't already in uniqueLocations, append it
      return [...uniqueLocations, location];
    }, []);
  }

  return movies;
};

const Movie = mongoose.model('Movie', movieSchema);

// LOCATION COLLECTION
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    require: true
  },
  coordinates: {
    type: [Number],  // coordinates are stored longitude at index 0, and then latitude at index 1
    required: true
  }
});

const polygonSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true
  },
  coordinates: {
    type: [[Number]],
    required: true
  }
});

const locationSchema = new mongoose.Schema({
  locationString: { type: String, required: true, unique: true },
  movies: [{
    movieId: {type: String, ref: 'Movie'},
    description: String
  }],
  geocodeResult: { type: {} },
  locationPoint: { type: pointSchema },  // if this location has a border, this point will be the center
  geohash: { type: String },
  geohashPrefixes: {
    9: String,
    8: String,
    7: String,
    6: String,
    5: String,
    4: String,
    3: String,
    2: String,
    1: String
  },
  locationBorder: { type: polygonSchema },  // not all locations will have borders, only those that aren't a specific place
  placeId: String
});

locationSchema.index({indexPoint: '2dsphere'});

locationSchema.methods.toString = function() {
  return `Location: (_id: ${this._id}, locationString: ${this.locationString}, lon: ${this.location.coordinates[0]}, lat: ${this.location.coordinates[1]})`;
};

/*
 * getNoCoordinateLocations gets all locations from the database that don't yet have any coordinate information
 */
locationSchema.statics.getNoCoordinateLocations = async function() {
  return await this.find({
    $or: [
      {geocodeResult: {$exists: false}},
      {locationPoint: {$exists: false}},
      {geohash: {$exists: false}}
    ]
  });
};

/*
 * getLocationsInBounds queries for all locations in the given bounds
 * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
 * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
 * @return: [Location] returns list of location objects that have locationPoint within the given bounds
 */
locationSchema.statics.getLocationsInBounds = async function(southWest, northEast) {
  return await Location.find().where('locationPoint').within({
    type: 'Polygon',
    coordinates: [[
      [southWest[1], southWest[0]],
      [northEast[1], southWest[0]],
      [northEast[1], northEast[0]],
      [southWest[1], northEast[0]],
      [southWest[1], southWest[0]]
    ]]
  });
};

/*
 * getClustersForGeohashes queries for all locations in each given geohash, and clusters the data aggregating relevant info
 * @param geohashes: an array of strings representing geohashes to get cluster data for
 * @param clusterFactor: determines what geohash prefix is used
 * @param movieId: optional argument, if specified only looks at location data relevant to the movie with the given id
 * @return: an array of cluster objects that were found, (geohashes with no locations are not included in the returned array)
 */
locationSchema.statics.getClustersForGeohashes = async function(geohashes, clusterFactor, movieId) {
  const aggregationPipeline = Location.aggregate();

  // only get locations that have coordinates
  aggregationPipeline.match({
    locationPoint: {$exists: true},
    [`geohashPrefixes.${clusterFactor}`]: {$exists: true}
  });

  // if a movieId is provided, filter to only locations that contain the movieId
  if (movieId != undefined) {
    aggregationPipeline.match({
      'movies.movieId': movieId
    });
  }

  // only get locations who's geohash prefix is in the given list of geohashes
  aggregationPipeline.match({
    [`geohashPrefixes.${clusterFactor}`]: {
      $in: geohashes
    }
  });

  aggregationPipeline.project({
    _id: 1,
    locationPoint: 1,
    locationString: 1,
    groupingGeohashPrefix: `$geohashPrefixes.${clusterFactor}`
  });

  aggregationPipeline.group({
    _id: '$groupingGeohashPrefix',
    numLocations: { $sum: 1 },
    locations: {
      $push: {
        id: '$_id',
        locationString: '$locationString',
        coordinate: {
          $reverseArray: '$locationPoint.coordinates'
        }
      }
    }
  });

  aggregationPipeline.project({
    _id: 0,
    id: '$_id',
    numLocations: 1,
    locations: 1,
  });

  return await aggregationPipeline.exec();
}

/*
 * getClustersInBounds queries for all locations in the given bounds, and clusters them based on their geohash
 * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
 * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
 * params clusterFactor: the power of the clustering, lower value means more locations will be clustered into larger groups
 * params movieId: optional param, if provided only locations for the movie with this id will be clustered
 * return: [{numLocations: number of locations, center: [lat, lon]}] a list of cluster objects containing the number of locations,
 *         and what the center of the cluster is
 */
locationSchema.statics.getClustersInBounds = async function(southWest, northEast, clusterFactor=3, movieId) {
  // containerGeohashPrefix is the smallest geohash that fully contains the given bounds
  const containingGeohashPrefix = getCommonPrefix(
    geohash.encode(southWest[0], southWest[1]),
    geohash.encode(northEast[0], northEast[1])
  )

  const aggregationPipeline = Location.aggregate();

  // only get locations that have coordinates
  aggregationPipeline.match({
    locationPoint: {$exists: true},
    [`geohashPrefixes.${clusterFactor}`]: {$exists: true}
  });

  // if a movieId is provided, filter to only locations that contain the movieId
  if (movieId !== undefined) {
    aggregationPipeline.match({
      'movies.movieId': movieId
    });
  }

  // optimize by filtering by the containing geohash prefix (if there is one)
  if (containingGeohashPrefix.length > 0) {
    aggregationPipeline.match({[`geohashPrefixes.${containingGeohashPrefix.length}`]: containingGeohashPrefix});
  }

  aggregationPipeline.project({
    _id: 1,
    locationPoint: 1,
    locationString: 1,
    placeId: 1,
    groupingGeohashPrefix: `$geohashPrefixes.${clusterFactor}`
  });

  aggregationPipeline.group({
    _id: '$groupingGeohashPrefix',
    numLocations: { $sum: 1 },
    locations: {
      $push: {
        id: '$_id',
        locationString: '$locationString',
        placeId: '$placeId',
        coordinate: {
          $reverseArray: '$locationPoint.coordinates'
        }
      }
    }
  });

  aggregationPipeline.project({
    _id: 0,
    id: '$_id',
    numLocations: 1,
    locations: 1,
  });

  return await aggregationPipeline.exec();
}

const Location = mongoose.model('Location', locationSchema);

module.exports = {
  Movie,
  Location
};
