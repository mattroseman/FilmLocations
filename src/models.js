const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  _id: String,
  title: {type: String, required: true},
  year: {type: Number, default: 0},
  numVotes: {type: Number, default: 0},
  rating: {type: Number, default: 0}
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

module.exports.Movie = Movie;
