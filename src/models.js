const mongoose = require('mongoose');

// MOVIE COLLECTION
const movieSchema = new mongoose.Schema({
  _id: String,
  title: {type: String, required: true},
  year: {type: Number, default: 0},
  numVotes: {type: Number, default: 0},
  rating: {type: Number, default: 0},
  locations: [{type: mongoose.Schema.Types.ObjectId, ref: 'Location'}]
});

// returns a string representation of a Movie for logging purposes
movieSchema.methods.toString = function() {
  return `Movie: (_id: ${this._id}, title: ${this.title}, year: ${this.year}, numVotes: ${this.numVotes}, rating: ${this.rating})`;
};

movieSchema.statics.getAllIds = async function() {
  return await this.find().distinct('_id');
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
  locationString: String,
  location: {
    type: pointSchema,
    required: false
  },
  movies: [{type: String, ref: 'Movie'}]
});

locationSchema.methods.toString = function() {
  return `Location: (_id: ${this._id}, locationString: ${this.locationString}, lon: ${this.location.coordinates[0]}, lat: ${this.location.coordinates[1]})`;
};

const Location = mongoose.model('Location', locationSchema);

module.exports = {
  Movie,
  Location
};
