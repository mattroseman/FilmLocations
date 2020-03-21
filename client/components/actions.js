/*
 * ACTION TYPES
 */

export const SET_MAP_VIEWPORT = 'SET_MAP_VIEWPORT';
export const SET_MAP_BOUNDS = 'SET_MAP_BOUNDS';
export const REQUEST_MAP_MARKERS = 'REQUEST_MAP_MARKERS';
export const RECEIVE_MAP_MARKERS = 'RECEIVE_MAP_MARKERS';

export const HIDE_MOVIE_INFO = 'HIDE_MOVIE_INFO';
export const SHOW_MOVIE_INFO = 'SHOW_MOVIE_INFO';
export const REQUEST_MOVIE_INFO_MOVIES_SHOWING = 'REQUEST_MOVIE_INFO_MOVIES_SHOWING';
export const RECEIVE_MOVIE_INFO_MOVIES_SHOWING = 'RECEIVE_MOVIE_INFO_MOVIES_SHOWING';
export const SET_MOVIE_INFO_SEARCH_TITLE = 'SET_MOVIE_INFO_SEARCH_TITLE';
export const REQUEST_MOVIE_INFO_SEARCH_SUGGESTIONS = 'REQUEST_MOVIE_INFO_SEARCH_SUGGESTIONS';
export const RECEIVE_MOVIE_INFO_SEARCH_SUGGESTIONS = 'RECEIVE_MOVIE_INFO_SEARCH_SUGGESTIONS';

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
    newBounds
  };
}
export function requestMapMarkers() {
  return { type: REQUEST_MAP_MARKERS };
}
export function receiveMapMarkers(newMarkers) {
  return {
    type: RECEIVE_MAP_MARKERS,
    newMarkers
  };
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
