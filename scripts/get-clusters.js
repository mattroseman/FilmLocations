const connectToDatabase = require('../lib/db.js');
const { Location } = require('../lib/models.js');
const { getDistance } = require('../lib/utils.js');

/*
 * getClusters queries all locations in the database, and clusters for different zoom levels, then stores in the database
 */ 
async function getClusters() {
  // connect to database
  if (!(await connectToDatabase())) {
    return;
  }

  const dbLocations = await Location.find().exists('locationPoint');
  let locations = dbLocations.map((location) => {
    return {
      locationString: location.locationString,
      locationPoint: {
        coordinates: location.locationPoint.coordinates.reverse()
      },
      geohash: location.geohash
    };
  });
  dbLocations.length = 0;
  console.log(`${locations.length} locations in database`);

  const clusters = await clusterLocations(locations, 1000, 2);
  console.log(`${clusters.length} clusters made`);

  // TODO add clusters to db
}

/*
 * clusterLocations, takes an array of location objects and clusters them
 */
async function clusterLocations(locations, eps=100, minPoints=2) {
  debugger;
  let currentCluster = 0;
  const totalNumLocations = locations.length;
  let locationsClustered = 0;

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

      locationsClustered++;
      console.log(`${locationsClustered}/${totalNumLocations} locations clustered`);

      continue;
    }

    const neighborsSet = new Set(neighbors.map((neighbor) => {return neighbor.geohash;}));

    currentCluster += 1;

    // label location as belonging to cluster numClusters (which is the current cluster)
    location.label = currentCluster;

    locationsClustered++;
    console.log(`${locationsClustered}/${totalNumLocations} locations clustered`);

    for (const neighbor of neighbors) {
      // if the neighbor was previously labelled as noise, update it to the current cluster
      if (neighbor.label === 'noise') {
        neighbor.label = currentCluster;

        locationsClustered++;
        console.log(`${locationsClustered}/${totalNumLocations} locations clustered`);

        continue;
      } 

      // if the neighbor was previously labelled to another cluster, don't change it
      if (neighbor.label !== undefined) {
        continue;
      }

      // add neighbor to the current cluster
      neighbor.label = currentCluster;

      locationsClustered++;
      console.log(`${locationsClustered}/${totalNumLocations} locations clustered`);

      const grandNeighbors = locations.filter((grandNeighbor) => {
        return getDistance(neighbor.locationPoint.coordinates, grandNeighbor.locationPoint.coordinates) <= eps && neighbor.locationString !== grandNeighbor.locationString;
      });

      // if the amount of grandNeighbors is over minPoints, add all grandNeighbors that aren't already in the neighbors array
      if (grandNeighbors.length + 1 >= minPoints) {
        for (const grandNeighbor of grandNeighbors) {
          if (!neighborsSet.has(grandNeighbor.geohash)) {
            neighbors.push(grandNeighbor);
            neighborsSet.add(grandNeighbor.geohash);
          }
        }
      }

      grandNeighbors.length = 0;
    }

    neighbors.length = 0;
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

module.exports = {
  getClusters
};
