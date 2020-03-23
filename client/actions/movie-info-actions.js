/*
 * ACTION TYPES
 */

export const SET_MOVIE_IDS_SHOWING = 'SET_MOVIE_IDS_SHOWING';
export const REQUEST_TOP_MOVIES = 'REQUEST_TOP_MOVIES';
export const UPDATE_TOP_MOVIES = 'UPDATE_TOP_MOVIES';

/*
 * ACTION CREATORS
 */

export function setMovieIdsShowing(movieIdsShowing) {
  return {
    type: SET_MOVIE_IDS_SHOWING,
    movieIdsShowing
  }
}

function requestTopMovies(movieIds, offset, size) {
  return {
    type: REQUEST_TOP_MOVIES,
    movieIds,
    offset,
    size
  }
}

function updateTopMovies(topMovies) {
  return {
    type: UPDATE_TOP_MOVIES,
    topMovies: topMovies
  };
}

/*
 * fetchTopMovies requests for movie info for the top movies showing
 * @param offset: the offset to get top movies from. So if 10, get's the top movies after the first 10
 * @param size: the number of top movies to get.
 */
export function fetchTopMovies() {
  return async function (dispatch, getState) {
    const { movieInfo: { topMoviesPageSize, topMovies, movieIdsShowing }} = getState();

    // don't do anything if there aren't any movie ids showing
    if (movieIdsShowing.length === 0) {
      return;
    }

    const offset = topMovies.length;
    const size = topMoviesPageSize;

    dispatch(requestTopMovies(movieIdsShowing, topMovies.length, topMoviesPageSize));

    const { domain } = getState();

    let newTopMovies = [];

    try {
      const response = await fetch(`${domain}/top-movies`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieIds: movieIdsShowing,
          offset: offset,
          limit: size
        })
      });

      newTopMovies = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting ${size} top movies from ${offset}\n${err}`);
    }

    dispatch(updateTopMovies(newTopMovies));
  };
}
