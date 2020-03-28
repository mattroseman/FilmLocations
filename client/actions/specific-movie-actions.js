import { setMovieIdsShowing } from './movie-info-actions.js';

/*
 * ACTION TYPES
 */

export const REQUEST_SPECIFIC_MOVIE = 'REQUEST_SPECIFIC_MOVIE';
export const SET_SPECIFIC_MOVIE = 'SET_SPECIFIC_MOVIE';
export const UNSET_SPECIFIC_MOVIE = 'UNSET_SPECIFIC_MOVIE';

/*
 * ACTION CREATORS
 */

function requestSpecificMovie(movieId, movieTitle) {
  return {
    type: REQUEST_SPECIFIC_MOVIE,
    movieId,
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
 * and an action to update movieIds showing
 */
export function showSpecificMovie(movie) {
  return async function(dispatch) {
    dispatch(setSpecificMovie(movie));
    dispatch(setMovieIdsShowing([movie._id]));
  }
}

/*
 * fetchSpecificMovie requests for movie info for the given id.
 */
export function fetchSpecificMovie(movieId='', movieTitle='') {
  return async function(dispatch, getState) {
    dispatch(requestSpecificMovie(movieId, movieTitle));

    const { domain } = getState();

    let movie = null;

    try {
      const response = await fetch(`${domain}/movie?id=${movieId}&title=${movieTitle}`);
      movie = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting movie info for movie with id: ${movieId}\n${err}`);
    }

    dispatch(showSpecificMovie(movie));
  }
}

export function unsetSpecificMovie() {
  return {
    type: UNSET_SPECIFIC_MOVIE
  };
}
