const { connectToDatabase } = require('../lib/db.js');

const { Location } = require('../lib/models.js');

connectToDatabase();

(async () => {
  const locationIds = await Location.find({
    $and: [
      {'geohash': {$exists: true}},
      {'geohashPrefixes': {$exists: false}}
    ]
  }).distinct('_id');

  const numLocations = locationIds.length;
  let locationsProcessed = 0;

  console.log(`${numLocations} locations with geohashes`);

  for (const locationId of locationIds) {
    const location = await Location.findOne({'_id': locationId});
    if (!location.geohash) {
      continue;
    }
    const geohash = location.geohash;

    location.geohashPrefixes = {
      9: geohash.slice(0, 9),
      8: geohash.slice(0, 8),
      7: geohash.slice(0, 7),
      6: geohash.slice(0, 6),
      5: geohash.slice(0, 5),
      4: geohash.slice(0, 4),
      3: geohash.slice(0, 3),
      2: geohash.slice(0, 2),
      1: geohash.slice(0, 1)
    }

    await location.save();

    locationsProcessed++;

    console.log(`${locationsProcessed}/${numLocations} geohash: ${geohash}`);
  }
})();
