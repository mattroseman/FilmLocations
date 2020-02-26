const mongoose = require('mongoose');
const geohash = require('ngeohash');

const { getCommonPrefix, getDistance } = require('../lib/utils.js');

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

locationSchema.index({locationPoint: '2dsphere'});

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
 * getClustersInBounds queries for all locations in the given bounds and clusters them
 * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
 * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
 * @return: [{locations: [<locations in cluster>], count: <number of locations>}, ...]
 */
locationSchema.statics.getClustersInBounds = async function(southWest, northEast) {
  console.time('getting locations and all nearby locations');
  let locations = await Location.find().where('locationPoint').within().box([southWest[1], southWest[0]], [northEast[1], northEast[0]]);
  // move data from model objects to new objects that aren't connected to the database
  locations = locations.map((location) => {
    return {
      locationString: location.locationString,
      locationPoint: {
        coordinates: location.locationPoint.coordinates.reverse()
      },
      geohash: location.geohash,
      movies: location.movies
    }
  });

  // TODO this query should be cached for a certain zoom level, and each incremental zoom level
  // TODO should be feasible to cache all clusters on map for large groups so that multiple second queries don't have ot happen
  // TODO then for smaller queries it can happen live

  console.log(`number of locations: ${locations.length}`);
  console.log(`distance: ${getDistance(southWest, northEast)}, eps: ${getDistance(southWest, northEast) * .001}`);

  const clusters = clusterLocations(locations, getDistance(southWest, northEast) * .03, 2);

  console.timeEnd('getting locations and all nearby locations');

  return clusters;
};

/*
 * clusterLocations takes an array of locations, the epsilon factor for clustring, and minimum number of locations to form a cluster
 * @param location: an array of location objects from the database to cluster
 * @param eps: epsilon, which is the clustering factor, The higher the value, the larger clusters will be
 * @param minPoints: the minimum number of points in a cluster
 * @return: [{locations: [<locations in cluster>], count: <number of locations>}, ...] an array of clusters
 */
function clusterLocations(locations, eps=2, minPoints=5) {
  let currentCluster = 0;

  for (const location of locations) {
    // continue if location has already been labelled 
    if (location.label !== undefined) {
      continue;
    }

    // get all locations within eps distance of location
    let neighbors = locations.filter((neighbor) => {
      return getDistance(location.locationPoint.coordinates, neighbor.locationPoint.coordinates) <= eps && location.locationString !== neighbor.locationString;
    });

    // if there are less than minPoints neighbors label location as noise and continue
    if (neighbors.length + 1 < minPoints) {
      location.label = 'noise';
      continue;
    }

    const neighborsSet = new Set(neighbors.map((neighbor) => {return neighbor.geohash;}));

    currentCluster += 1;

    // label location as belonging to cluster numClusters (which is the current cluster)
    location.label = currentCluster;

    for (const neighbor of neighbors) {
      // if the neighbor was previously labelled as noise, update it to the current cluster
      if (neighbor.label === 'noise') {
        neighbor.label = currentCluster;
        continue;
      } 

      // if the neighbor was previously labelled to another cluster, don't change it
      if (neighbor.label !== undefined) {
        continue;
      }

      // add neighbor to the current cluster
      neighbor.label = currentCluster;

      const grandNeighbors = locations.filter((grandNeighbor) => {
        return getDistance(neighbor.locationPoint.coordinates, grandNeighbor.locationPoint.coordinates) <= eps && neighbor.locationString !== grandNeighbor.locationString;
      });

      // if the amount of grandNeighbors is over minPoints, add all grandNeighbors that aren't already in the neighbors array
      if (grandNeighbors.length + 1 >= minPoints) {
        for (const grandNeighbor of grandNeighbors) {
          if (!neighborsSet.has(grandNeighbor)) {
            neighbors.push(grandNeighbor);
          }
        }
      }
    }
  }

  const clusters = {};
  for (const location of locations) {
    if (location.label === 'noise') {
      clusters[location.geohash] = {
        id: location.geohash,
        numLocations: 1,
        locations: [{
          locationString: location.locationString,
          coordinate: location.locationPoint.coordinates,
        }],
      };
    } else if (location.label in clusters) {
      clusters[location.label].numLocations++;
      clusters[location.label].locations.push({
        locationString: location.locationString,
        coordinate: location.locationPoint.coordinates
      });
    } else {
      clusters[location.label] = {
        id: location.label,
        numLocations: 1,
        locations: [{
          locationString: location.locationString,
          coordinate: location.locationPoint.coordinates
        }]
      };
    }
  }

  return Object.values(clusters);
}

const Location = mongoose.model('Location', locationSchema);

module.exports = {
  Movie,
  Location
};
