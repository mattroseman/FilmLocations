/*
 * ACTION TYPES
 */

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

export function hideMovieInfo() {
  return { type: HIDE_MOVIE_INFO };
}
export function showMovieInfo() {
  return { type: SHOW_MOVIE_INFO };
}
export function requestMovieInfoMoviesShowing() {
  return { type: REQUEST_MOVIE_INFO_MOVIES_SHOWING };
}
export function receiveMovieInfoMoviesShowing(moviesShowing) {
  return {
    type: RECEIVE_MOVIE_INFO_MOVIES_SHOWING,
    moviesShowing
  };
}
export function setMovieInfoSearchTitle(searchTitle) {
  return {
    type: SET_MOVIE_INFO_SEARCH_TITLE,
    searchTitle
  };
}
export function requestMovieInfoSearchSuggestions() {
  return { type: REQUEST_MOVIE_INFO_SEARCH_SUGGESTIONS };
}
export function receiveMovieInfoSearchSuggestions(searchSuggestions) {
  return {
    type: RECEIVE_MOVIE_INFO_SEARCH_SUGGESTIONS,
    searchSuggestions
  };
}
