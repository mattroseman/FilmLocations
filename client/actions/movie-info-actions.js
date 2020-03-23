/*
 * ACTION TYPES
 */

export const SET_MOVIE_IDS_SHOWING = 'SET_MOVIE_IDS_SHOWING';
export const REQUEST_TOP_MOVIES = 'REQUEST_TOP_MOVIES';
export const SET_TOP_MOVIES = 'SET_TOP_MOVIES';

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

function setTopMovies(topMovies) {
  return {
    type: SET_TOP_MOVIES,
    topMovies: topMovies.reduce((topMoviesObj, topMovies) => {
      return {
        ...topMoviesObj,
        [topMovies.id]: topMovies
      }
    }, {})
  };
}

/*
 * fetchTopMovies requests for movie info for the top movies showing
 * @param offset: the offset to get top movies from. So if 10, get's the top movies after the first 10 
 * @param size: the number of top movies to get.
 */
export function fetchTopMovies(offset, size) {
  return async function (dispatch, getState) {
    const { movieInfo: { movieIdsShowing }} = getState();

    dispatch(requestTopMovies(movieIdsShowing, offset, size));

    const { domain } = getState();

    let topMovies = [];

    try {
      const response = await fetch(`${domain}/top-movies`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieIds: movieIdsShowing,
          offset,
          size
        })
      });

      topMovies = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting ${size} top movies from ${offset}\n${err}`);
    }

    dispatch(setTopMovies(topMovies));
  };
}
