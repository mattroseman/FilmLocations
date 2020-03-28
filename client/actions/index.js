export {
  SET_MAP_VIEWPORT,
  SET_MAP_BOUNDS,
  REQUEST_LOCATION_CLUSTERS,
  SET_MAP_MARKERS,

  setMapViewport,
  setMapBounds,
  setSpecificMovieMapMarkers,
  fetchMapMarkers
} from './map-actions.js';

export {
  SET_MOVIE_IDS_SHOWING,
  REQUEST_TOP_MOVIES,
  UPDATE_TOP_MOVIES,
  SHOW_ALL_TOP_MOVIE_LOCATIONS,
  SHOW_DEFAULT_TOP_MOVIE_LOCATIONS,
  SET_SEARCH_TITLE,
  REQUEST_SEARCH_SUGGESTIONS,
  SET_SEARCH_SUGGESTIONS,

  fetchTopMovies,
  showAllTopMovieLocations,
  showDefaultTopMovieLocations,
  setSearchTitle,
  setSearchSuggestions,
  fetchSearchSuggestions
} from './movie-info-actions.js';

/*
 * ACTION TYPES
 */

export const SHOW_SPECIFIC_MOVIE = 'SHOW_SPECIFIC_MOVIE';
export const SHOW_ALL_MOVIES = 'SHOW_ALL_MOVIES';
export const SET_DOMAIN = 'SET_DOMAIN';

/*
 * ACTION CREATORS
 */

export function showSpecificMovie(specificMovie) {
  return {
    type: SHOW_SPECIFIC_MOVIE,
    specificMovie
  };
}

export function showAllMovies() {
  return {
    type: SHOW_ALL_MOVIES
  };
}

export function setDomain(domain) {
  return {
    type: SET_DOMAIN,
    domain
  };
}
