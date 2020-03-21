/*
 * ACTION TYPES
 */

export const SET_MAP_VIEWPORT = 'SET_MAP_VIEWPORT';
export const SET_MAP_BOUNDS = 'SET_MAP_BOUNDS';
export const REQUEST_LOCATION_CLUSTERS = 'REQUEST_LOCATION_CLUSTERS';
export const SET_MAP_MARKERS = 'SET_MAP_MARKERS';

export const HIDE_MOVIE_INFO = 'HIDE_MOVIE_INFO';
export const SHOW_MOVIE_INFO = 'SHOW_MOVIE_INFO';
export const REQUEST_MOVIE_INFO_MOVIES_SHOWING = 'REQUEST_MOVIE_INFO_MOVIES_SHOWING';
export const RECEIVE_MOVIE_INFO_MOVIES_SHOWING = 'RECEIVE_MOVIE_INFO_MOVIES_SHOWING';
export const SET_MOVIE_INFO_SEARCH_TITLE = 'SET_MOVIE_INFO_SEARCH_TITLE';
export const REQUEST_MOVIE_INFO_SEARCH_SUGGESTIONS = 'REQUEST_MOVIE_INFO_SEARCH_SUGGESTIONS';
export const RECEIVE_MOVIE_INFO_SEARCH_SUGGESTIONS = 'RECEIVE_MOVIE_INFO_SEARCH_SUGGESTIONS';

export const SET_DOMAIN = 'SET_DOMAIN';

/*
 * ACTION CREATORS
 */

export function setMapViewport(newViewport) {
  return {
    type: SET_MAP_VIEWPORT,
    newViewport
  };
}
export function setMapBounds(newBounds) {
  return {
    type: SET_MAP_BOUNDS,
    newBounds: {
      southWest: [newBounds._southWest.lat, newBounds._southWest.lng],
      northEast: [newBounds._northEast.lat, newBounds._northEast.lng]
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
  const newMarkers = {};

  for (const cluster of locationClusters) {
    newMarkers[cluster.id] = {
      id: cluster.id,
      count: cluster.numLocations,
      coordinate: cluster.center,
      locations: cluster.locations
    }
  }

  return {
    type: SET_MAP_MARKERS,
    newMarkers: newMarkers
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
      clusters = [];
    }

    dispatch(setMapMarkers(clusters));
  }
}

export function hideMovieInfo() {
  return { type: HIDE_MOVIE_INFO };
}
export function showMovieInfo() {
  return { type: SHOW_MOVIE_INFO };
}
export function requestMovieInfoMoviesShowing() {
  return { type: REQUEST_MOVIE_INFO_MOVIES_SHOWING };
}
export function receiveMovieInfoMoviesShowing(newMoviesShowing) {
  return {
    type: RECEIVE_MOVIE_INFO_MOVIES_SHOWING,
    newMoviesShowing
  };
}
export function setMovieInfoSearchTitle(newSearchTitle) {
  return {
    type: SET_MOVIE_INFO_SEARCH_TITLE,
    newSearchTitle
  };
}
export function requestMovieInfoSearchSuggestions() {
  return { type: REQUEST_MOVIE_INFO_SEARCH_SUGGESTIONS };
}
export function receiveMovieInfoSearchSuggestions(newSearchSuggestions) {
  return {
    type: RECEIVE_MOVIE_INFO_SEARCH_SUGGESTIONS,
    newSearchSuggestions
  };
}

export function setDomain(domain) {
  return {
    type: SET_DOMAIN,
    domain
  };
}
