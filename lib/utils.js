/*
 * getCommonPrefix finds the common prefix between two strings
 */
function getCommonPrefix(a, b) {
  let commonPrefix = '';

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      break;
    }

    commonPrefix += a[i];
  }

  return commonPrefix;
}

/*
 * getCoordinatesCenter takes an array of lat long coordinate pairs, and calculates the center coordinate
 * param coordinates: an array of [lat, lon] arrays
 * return: a single [lat, lon] array that is the center of the given coordinates
 */
function getCoordinatesCenter(coordinates) {
  const numCoordinates = coordinates.length;

  const cartesianCoordinateSum = coordinates.reduce((cartesianSum, coordinate) => {
    const cartesianCoordinate = latlonToCartesian(coordinate);
    cartesianSum[0] += cartesianCoordinate[0];
    cartesianSum[1] += cartesianCoordinate[1];
    cartesianSum[2] += cartesianCoordinate[2];

    return cartesianSum;
  }, [0, 0, 0]);

  cartesianCoordinateSum[0] /= numCoordinates;
  cartesianCoordinateSum[1] /= numCoordinates;
  cartesianCoordinateSum[2] /= numCoordinates;

  return cartesianToLatLon(cartesianCoordinateSum);
}

/*
 * latlonToCaresian takes a latitute/longitude coordinate, and converts it to cartesian format
 * param coordinate: a [lat, lon] array (in degrees)
 * return: [x, y, z] array representing the given coordinate in cartesian format
 */
function latlonToCartesian(latlonCoordinate) {
  // convert lat and lon to radians
  const lat = +latlonCoordinate[0] * (Math.PI/180);
  const lon = +latlonCoordinate[1] * (Math.PI/180);

  const x = Math.cos(lat) * Math.cos(lon);
  const y = Math.cos(lat) * Math.sin(lon);
  const z = Math.sin(lat);

  return [x, y, z];
}

/*
 * cartesianToLatLon takes a cartesian coordinate and converts it to latitude/longitude format
 * param coordinate: a [x, y, z] cartesian coordinate
 * return: [lat, lon] array representing the given coordinate in lat/lon format (in degrees)
 */
function cartesianToLatLon(cartesianCoordinate) {
  const x = +cartesianCoordinate[0];
  const y = +cartesianCoordinate[1];
  const z = +cartesianCoordinate[2];

  const r = Math.sqrt(x**2 + y**2);
  let lat = Math.atan2(z, r);
  let lon = Math.atan2(y, x);

  // convert lat lon to degrees
  lat = lat * (180/Math.PI);
  lon = lon * (180/Math.PI);

  return [lat, lon]
}

/*
 * getDistance calculates the distance between two lat lon coordinates points
 * param a,b: [lat, lon] array
 * return: distance in km between the two points
 */
function getDistance(aCoordinate, bCoordinate) {
  const R = 6371;  // estimate for eath radius
  const aLat = aCoordinate[0] * (Math.PI/180);
  const bLat = bCoordinate[0] * (Math.PI/180);
  const deltaLat = (aCoordinate[0] - bCoordinate[0]) * (Math.PI/180);
  const deltaLon = (aCoordinate[1] - bCoordinate[1]) * (Math.PI/180);

  const a = (Math.sin(deltaLat/2)**2) + (Math.cos(aLat)*Math.cos(bLat)) * (Math.sin(deltaLon/2)**2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return c * R;
}

module.exports = { getCommonPrefix, getCoordinatesCenter, getDistance }
