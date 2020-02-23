const mongoose = require('mongoose');

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
      {locationPoint: {$exists: false}}
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

const Location = mongoose.model('Location', locationSchema);

module.exports = {
  Movie,
  Location
};
