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

export function setSpecificMovie(movie) {
  return {
    type: SET_SPECIFIC_MOVIE,
    movie
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

    dispatch(setSpecificMovie(movie));
  }
}

export function unsetSpecificMovie() {
  return {
    type: UNSET_SPECIFIC_MOVIE
  };
}
