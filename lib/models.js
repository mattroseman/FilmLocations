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
 * getTopMovies takes a list of movie ids and gets a list of movie info sorted by number of ratings
 * param ids: an array of movie ids to search for
 * param numMovies: only return the top <numMovies> movies
 * return: a sorted list of <numMovies> movie documents
 */
movieSchema.statics.getTopMovies = async function(movieIds=[], numMovies=100)  {
  const aggregationPipeline = Movie.aggregate();

  aggregationPipeline.match({
    _id: {
      $in: movieIds
    }
  });

  aggregationPipeline.sort({
    numVotes: 'descending'
  });

  aggregationPipeline.limit(numMovies);

  aggregationPipeline.lookup({
    from: 'locations',
    localField: 'locations.locationId',
    foreignField: '_id',
    as: 'locationsInfo'
  });

  aggregationPipeline.project({
    _id: 1,
    title: 1,
    year: 1,
    locations: '$locations',
    'locationsInfo._id': 1,
    'locationsInfo.locationString': 1,
    'locationsInfo.locationPoint': 1
  });

  let movies = await aggregationPipeline.exec();

  movies = movies.map((movie) => {
    movie.locationsInfo = movie.locationsInfo.map((locationInfo) => {
      for (const location of movie.locations) {
        if (locationInfo._id.toString() === location.locationId.toString()) {
          locationInfo.description = location.description;
          break;
        }
      }

      if (locationInfo.locationPoint !== undefined) {
        locationInfo.locationPoint = locationInfo.locationPoint.coordinates.reverse();
      }

      return locationInfo
    });

    movie.locations = movie.locationsInfo;
    delete movie.locationsInfo

    return movie;
  });

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
 * getClustersInBounds queries for all locations in the given bounds, and clusters them based on their geohash
 * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
 * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
 * params clusterFactor: the power of the clustering, lower value means more locations will be clustered into larger groups
 * return: [{numLocations: number of locations, center: [lat, lon]}] a list of cluster objects containing the number of locations,
 *         and what the center of the cluster is
 */
locationSchema.statics.getClustersInBounds = async function(southWest, northEast, clusterFactor=3) {
  const containingGeohashPrefix = getCommonPrefix(
    geohash.encode(southWest[0], southWest[1]),
    geohash.encode(northEast[0], northEast[1])
  )

  const aggregationPipeline = Location.aggregate();

  aggregationPipeline.match({
    locationPoint: {$exists: true}
  });

  // if there is a geohash prefix, filter by that first, before using geolocation query
  if (containingGeohashPrefix.length > 0) {
    aggregationPipeline.match({[`geohashPrefixes.${containingGeohashPrefix.length}`]: containingGeohashPrefix});
  }

  aggregationPipeline.match({
    'locationPoint': {
      $geoWithin: {
        $box: [
          [southWest[1], southWest[0]],
          [northEast[1], northEast[0]]
        ]
      }
    }
  });

  aggregationPipeline.project({
    _id: 0,
    locationPoint: 1,
    locationString: 1,
    movies: 1,
    groupingGeohashSubstr: {
      $substr: ['$geohash', 0, clusterFactor]
    }
  });

  aggregationPipeline.group({
    _id: '$groupingGeohashSubstr',
    numLocations: { $sum: 1 },
    locations: { 
      $push: {
        locationString: '$locationString',
        coordinate: {
          $reverseArray: '$locationPoint.coordinates'
        }
      }
    },
    movies: {
      $push: '$movies'
    }
  });

  aggregationPipeline.project({
    _id: 0,
    id: '$_id',
    numLocations: 1,
    locations: 1,
    movies: 1
  });

  const clusters = await aggregationPipeline.exec();

  // flatten the array of movies for each cluster, and only include the movieId field
  clusters.map((cluster) => {
    cluster.movies = cluster.movies.flat().map((movie) => movie.movieId);
  });

  return clusters;
}

locationSchema.statics.getTopMovies = async function(southWest, northEast, limit=100) {
  const containingGeohashPrefix = getCommonPrefix(
    geohash.encode(southWest[0], southWest[1]),
    geohash.encode(northEast[0], northEast[1])
  )

  const aggregationPipeline = Location.aggregate();

  aggregationPipeline.match({
    locationPoint: {$exists: true}
  });

  aggregationPipeline.match({
    'movies.0': {$exists: true}
  });

  aggregationPipeline.match({
    'geohash': {
      $regex: new RegExp(`^${containingGeohashPrefix}`, 'i')
    }
  });

  aggregationPipeline.match({
    'locationPoint': {
      $geoWithin: {
        $box: [
          [southWest[1], southWest[0]],
          [northEast[1], northEast[0]]
        ]
      }
    }
  });

  aggregationPipeline.project({
    _id: 0,
    movies: 1
  });

  aggregationPipeline.unwind('movies');

  aggregationPipeline.lookup({
    from: 'movies',
    localField: 'movies',
    foreignField: '_id',
    as: 'movies'
  });

  aggregationPipeline.project({
    _id: '$movies._id',
    title: '$movies.title',
    numVotes: '$movies.numVotes',
    locations: '$movies.locations'
  });

  aggregationPipeline.sort({
    numVotes: 'descending'
  });

  aggregationPipeline.limit(limit);

  return await aggregationPipeline.exec();
}

const Location = mongoose.model('Location', locationSchema);

module.exports = {
  Movie,
  Location
};
