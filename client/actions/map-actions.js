/*
 * ACTION TYPES
 */

export const SET_MAP_VIEWPORT = 'SET_MAP_VIEWPORT';
export const SET_MAP_BOUNDS = 'SET_MAP_BOUNDS';
export const REQUEST_LOCATION_CLUSTERS = 'REQUEST_LOCATION_CLUSTERS';
export const SET_MAP_MARKERS = 'SET_MAP_MARKERS';

/*
 * ACTION CREATORS
 */

export function setMapViewport(viewport) {
  return {
    type: SET_MAP_VIEWPORT,
    viewport
  };
}

export function setMapBounds(bounds) {
  return {
    type: SET_MAP_BOUNDS,
    bounds: {
      southWest: [bounds._southWest.lat, bounds._southWest.lng],
      northEast: [bounds._northEast.lat, bounds._northEast.lng]
    }
  };
}

function requestLocationClusters(bounds, zoom) {
  return {
    type: REQUEST_LOCATION_CLUSTERS,
    bounds,
    zoom
  };
}

function setMapMarkers(locationClusters) {
  const markers = {};

  for (const cluster of locationClusters) {
    markers[cluster.id] = {
      id: cluster.id,
      count: cluster.numLocations,
      coordinate: cluster.center,
      locations: cluster.locations
    }
  }

  return {
    type: SET_MAP_MARKERS,
    markers: markers
  };
}

export function fetchMapMarkers(bounds, zoom) {
  return async function(dispatch, getState) {
    dispatch(requestLocationClusters(bounds, zoom));

    const { domain } = getState();

    const southWest = bounds.southWest;
    const northEast = bounds.northEast;

    let clusters = [];

    try {
      const response = await fetch(`${domain}/film-clusters?swlat=${southWest[0]}&swlon=${southWest[1]}&nelat=${northEast[0]}&nelon=${northEast[1]}&zoom=${zoom}`)
      clusters = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting clusters for current bounds: ${bounds} at zoom: ${zoom}\n${err}`);
    }

    dispatch(setMapMarkers(clusters));
  }
}
