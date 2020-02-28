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
  locations: [{type: mongoose.Schema.Types.ObjectId, ref: 'Location'}],
  lastLocationUpdateDate: {type: Date, default: Date.now}
});

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
 * getAllRelevantIds queries for all movie ids with num of votes over the given minimum
 */
movieSchema.statics.getAllRelevantIds = async function(num_votes_min) {
  return await this.find({
    $and: [
      {"numVotes": {$gte: num_votes_min}},
      {"lastLocationUpdateDate": {$exists: false}}
    ]
  }).distinct('_id');
};

/*
 * getAllStaleIds queries for all unqiue movie id's that havn't had location updated today yet
 */
movieSchema.statics.getAllStaleIds = async function() {
  return await this.find({
    $or: [
      {lastLocationUpdateDate: { $lt: new Date(new Date().setHours(0, 0, 0, 0)) }},
      {lastLocationUpdateDate: null}
    ]
  }).distinct('_id');
};

/*
 * getAllNewMovieIds queries for all unique movie id's that have never had their location's updated
 */
movieSchema.statics.getAllNewIds = async function() {
  return await this.find({
    lastLocationUpdateDate: null
  }).distinct('_id');
};

movieSchema.statics.idExists = async function(id) {
  return await this.exists({_id: id});
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
  movies: [{type: String, ref: 'Movie'}],
  geocodeResult: { type: {} },
  locationPoint: { type: pointSchema },  // if this location has a border, this point will be the center
  geohash: { type: String },
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
locationSchema.statics.getClustersInBounds = async function(southWest, northEast, clusterFactor=3, horizontalMargin=0, verticalMargin=0) {
  const geohashCommonLength = clusterFactor;


  const aggregationPipeline = Location.aggregate();

  aggregationPipeline.project({
    _id: 0,
    locationPoint: 1,
    locationString: 1,
    movies: 1,
    groupingGeohashSubstr: {
      $substr: ["$geohash", 0, geohashCommonLength]
    }
  });

  aggregationPipeline.match({
    locationPoint: {$exists: true}
  });

  aggregationPipeline.match({
    "locationPoint": {
      $geoWithin: {
        $box: [
          [southWest[1] - verticalMargin, southWest[0] - horizontalMargin],
          [northEast[1] + verticalMargin, northEast[0] + horizontalMargin]
        ]
      }
    }
  });

  aggregationPipeline.group({
    _id: "$groupingGeohashSubstr",
    count: { $sum: 1 },
    points: { 
      $push: {
        locationString: "$locationString",
        coordinate: "$locationPoint.coordinates",
        movies: "$movies"
      }
    }
  });

  const clusters = await aggregationPipeline.exec();

  // fix the points in the cluster so that they are in the expected [lat, lon] format
  return clusters.map((cluster) => {
    return {
      id: cluster._id,
      numLocations: cluster.count,
      locations: cluster.points.map((point) => {
        return {
          locationString: point.locationString,
          coordinate: [point.coordinate[1], point.coordinate[0]],
          movies: point.movies
        }
      })
    };
  });
}

const Location = mongoose.model('Location', locationSchema);

module.exports = {
  Movie,
  Location
};
