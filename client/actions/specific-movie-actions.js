import { setMovieIdsShowing, updateTopMovies } from './movie-info-actions.js';

/*
 * ACTION TYPES
 */

export const REQUEST_SPECIFIC_MOVIE = 'REQUEST_SPECIFIC_MOVIE';
export const SET_SPECIFIC_MOVIE = 'SET_SPECIFIC_MOVIE';
export const UNSET_SPECIFIC_MOVIE = 'UNSET_SPECIFIC_MOVIE';

/*
 * ACTION CREATORS
 */

function requestSpecificMovie(movieTitle) {
  return {
    type: REQUEST_SPECIFIC_MOVIE,
    movieTitle
  };
}

function setSpecificMovie(movie) {
  return {
    type: SET_SPECIFIC_MOVIE,
    movie
  };
}

/*
 * showSpecificMovie dispatches actions to set the specific movie to the given movie,
 * and actions to update movie info states
 */
export function showSpecificMovie(movie) {
  return async function(dispatch) {
    dispatch(setSpecificMovie(movie));

    dispatch(setMovieIdsShowing([movie.id]));
    dispatch(updateTopMovies([movie]));
  };
}

/*
 * fetchSpecificMovie requests for movie info for the given id.
 */
export function fetchSpecificMovie(movieTitle='') {
  return async function(dispatch, getState) {
    dispatch(requestSpecificMovie(movieTitle));

    const { domain } = getState();

    let movie = null;

    try {
      const response = await fetch(`${domain}/movie?title=${movieTitle}`);
      const body = await response.json();

      if (!body.success) {
        console.error(`something wen't wrong getting movie info for ${movieTitle}\n${body}`);
        return;
      }

      movie = body.movie;
    } catch (err) {
      console.error(`something wen't wrong getting movie info for "${movieTitle}"\n${err}`);
      return;
    }

    dispatch(showSpecificMovie(movie));
  }
}

export function unsetSpecificMovie() {
  return {
    type: UNSET_SPECIFIC_MOVIE
  };
}
