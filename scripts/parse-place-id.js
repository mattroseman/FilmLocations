const chalk = require('chalk');
const { connectToDatabase } = require('../lib/db.js');
const { Location } = require('../lib/models.js');

async function parsePlaceId() {
  // connect to database
  if (!(await connectToDatabase())) {
    return;
  }

  // get list of all locations from database that are missing placeID data
  let locationIds;
  try {
    locationIds = await Location.find({
      $and: [
        { placeId: { $exists: false }},
        {geocodeResult: { $exists: true}}
      ]
    }).distinct('_id');
  } catch (err) {
    console.error(chalk.red(`something wen't wrong getting locations from db\n${err}`));
  }
  let numLocations = locationIds.length;
  let numLocationsProcessed = 0;

  console.log(`${numLocations} locations found without a place id value`)

  for (const locationId of locationIds) {
    let location = await Location.findOne({ _id: locationId });

    // skip any locations that already have a place id parsed out
    if (location.placeId != null) {
      continue;
    }

    if ('place_id' in location.geocodeResult && location.geocodeResult.place_id != null && location.geocodeResult.place_id.length > 0) {
      location.placeId = location.geocodeResult.place_id;
      console.log(location.placeId);
    } else {
      location.placeId = null;
    }

    await location.save();

    numLocationsProcessed++;
    console.log(`${numLocationsProcessed}/${numLocations} locations have place id parsed out of geocode result`);
  }
}

module.exports.parsePlaceId = parsePlaceId;
