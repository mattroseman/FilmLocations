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
    type: [Number],
    required: true
  }
});

const locationSchema = new mongoose.Schema({
  locationString: { type: String, required: true },
  location: { type: pointSchema, required: false },
  movies: [{type: String, ref: 'Movie'}],
  geocodeResult: { type: {}, required: false }
});

locationSchema.methods.toString = function() {
  return `Location: (_id: ${this._id}, locationString: ${this.locationString}, lon: ${this.location.coordinates[0]}, lat: ${this.location.coordinates[1]})`;
};

/*
 * getNoGeocodeResultLocations gets all locations from the database that don't yet have a raw geocode result from the database
 */
locationSchema.statics.getNoGeocodeResultLocations = async function() {
  return await this.find({
    geocodeResult: {$exists: false}
  });
};

const Location = mongoose.model('Location', locationSchema);

module.exports = {
  Movie,
  Location
};
