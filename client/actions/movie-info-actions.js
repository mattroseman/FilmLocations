/*
 * ACTION TYPES
 */

export const SET_MOVIE_IDS_SHOWING = 'SET_MOVIE_IDS_SHOWING';
export const REQUEST_TOP_MOVIES = 'REQUEST_TOP_MOVIES';
export const UPDATE_TOP_MOVIES = 'UPDATE_TOP_MOVIES';

export const SHOW_ALL_TOP_MOVIE_LOCATIONS = 'SHOW_ALL_TOP_MOVIE_LOCATIONS';
export const SHOW_DEFAULT_TOP_MOVIE_LOCATIONS = 'SHOW_DEFAULT_TOP_MOVIE_LOCATIONS';

export const SET_SEARCH_TITLE = 'SET_SEARCH_TITLE';
export const REQUEST_SEARCH_SUGGESTIONS = 'REQUEST_SEARCH_SUGGESTIONS';
export const SET_SEARCH_SUGGESTIONS = 'SET_SEARCH_SUGGESTIONS';

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
  const topMoviesObj = {};

  for (const topMovie of topMovies) {
    topMoviesObj[topMovie._id] = {
      ...topMovie
    };
  }

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

    const offset = Object.keys(topMovies).length;
    const size = topMoviesPageSize;

    dispatch(requestTopMovies(movieIdsShowing, offset, size));

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

export function showAllTopMovieLocations(topMovieId) {
  return {
    type: SHOW_ALL_TOP_MOVIE_LOCATIONS,
    topMovieId
  };
}

export function showDefaultTopMovieLocations(topMovieId) {
  return {
    type: SHOW_DEFAULT_TOP_MOVIE_LOCATIONS,
    topMovieId
  };
}

export function setSearchTitle(movieTitle) {
  return {
    type: SET_SEARCH_TITLE,
    movieTitle
  }
}

function requestSearchSuggestions(moviePrefix) {
  return {
    type: REQUEST_SEARCH_SUGGESTIONS,
    moviePrefix
  }
}

export function setSearchSuggestions(suggestions) {
  return {
    type: SET_SEARCH_SUGGESTIONS,
    suggestions
  }
}

// these are used to cancel previous suggestion requests when a new character is typed
let abortController;
let signal;
export function fetchSearchSuggestions(prefix) {
  return async function(dispatch, getState) {
    // clear suggestions if prefix is a blank string
    if (prefix.length === 0) {
      dispatch(setSearchSuggestions([]));
      return;
    }

    dispatch(requestSearchSuggestions(prefix));

    const { domain } = getState();

    // cancel any previous request
    if (abortController !== undefined) {
      abortController.abort();
    }
    if ('AbortController' in window) {
      abortController = new AbortController();
      signal = abortController.signal;
    }

    let suggestions = [];

    try {
      const response = await fetch(`${domain}/movie-titles?prefix=${prefix}`, {signal});
      suggestions = await response.json();
    } catch (err) {
      // AbortError's are expected
      if (err.name !== 'AbortError') {
        console.error(`something wen't wrong getting suggestions for prefix ${prefix}\n${err}`);
      }
    }

    dispatch(setSearchSuggestions(suggestions));
  }
}
