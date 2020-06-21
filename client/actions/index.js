export {
  SET_MAP_VIEWPORT,
  SET_MAP_BOUNDS,
  REQUEST_LOCATION_CLUSTERS,
  REQUEST_SPECIFIC_MOVIE_LOCATION_CLUSTERS,
  SET_MAP_MARKERS,
  HIGHLIGHT_MARKER,
  UNHIGHLIGHT_MARKER,
  FOCUS_LOCATION,

  setMapViewport,
  setMapBounds,
  fetchMapMarkers,
  highlightMarker,
  unhighlightMarker,
  focusLocation,
} from './map-actions.js';

export {
  SET_MOVIE_IDS_SHOWING,
  REQUEST_TOP_MOVIES,
  SET_TOP_MOVIES,
  UPDATE_TOP_MOVIES,
  SHOW_ALL_TOP_MOVIE_LOCATIONS,
  SHOW_DEFAULT_TOP_MOVIE_LOCATIONS,
  SET_SEARCH_TITLE,
  REQUEST_SEARCH_SUGGESTIONS,
  SET_SEARCH_SUGGESTIONS,
  SHOW_MOVIE_INFO,
  HIDE_MOVIE_INFO,

  setMovieIdsShowing,
  updateTopMovies,
  fetchTopMovies,
  showAllTopMovieLocations,
  showDefaultTopMovieLocations,
  setSearchTitle,
  setSearchSuggestions,
  fetchSearchSuggestions,
  showMovieInfo,
  hideMovieInfo,
} from './movie-info-actions.js';

export {
  REQUEST_SPECIFIC_MOVIE,
  SET_SPECIFIC_MOVIE,
  UNSET_SPECIFIC_MOVIE,

  showSpecificMovie,
  fetchSpecificMovie,
  unsetSpecificMovie
} from './specific-movie-actions.js';

/*
 * ACTION TYPES
 */

export const SET_DOMAIN = 'SET_DOMAIN';

/*
 * ACTION CREATORS
 */

export function setDomain(domain) {
  return {
    type: SET_DOMAIN,
    domain
  };
}
