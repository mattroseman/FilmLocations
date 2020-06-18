/*
 * ACTION TYPES
 */

export const SET_MOVIE_IDS_SHOWING = 'SET_MOVIE_IDS_SHOWING';
export const REQUEST_TOP_MOVIES = 'REQUEST_TOP_MOVIES';
export const SET_TOP_MOVIES = 'SET_TOP_MOVIES';
export const UPDATE_TOP_MOVIES = 'UPDATE_TOP_MOVIES';

export const SHOW_ALL_TOP_MOVIE_LOCATIONS = 'SHOW_ALL_TOP_MOVIE_LOCATIONS';
export const SHOW_DEFAULT_TOP_MOVIE_LOCATIONS = 'SHOW_DEFAULT_TOP_MOVIE_LOCATIONS';

export const SET_SEARCH_TITLE = 'SET_SEARCH_TITLE';
export const REQUEST_SEARCH_SUGGESTIONS = 'REQUEST_SEARCH_SUGGESTIONS';
export const SET_SEARCH_SUGGESTIONS = 'SET_SEARCH_SUGGESTIONS';

export const SHOW_MOVIE_INFO = 'SHOW_MOVIE_INFO';
export const HIDE_MOVIE_INFO = 'HIDE_MOVIE_INFO';

/*
 * ACTION CREATORS
 */

export function setMovieIdsShowing(movieIdsShowing) {
  return {
    type: SET_MOVIE_IDS_SHOWING,
    movieIdsShowing
  }
}

function requestTopMovies(geohashes, offset, size, append) {
  return {
    type: REQUEST_TOP_MOVIES,
    geohashes,
    offset,
    size,
    append
  }
}

export function setTopMovies(topMovies) {
  return {
    type: SET_TOP_MOVIES,
    topMovies
  };
}

export function updateTopMovies(topMovies) {
  return {
    type: UPDATE_TOP_MOVIES,
    topMovies
  };
}

/*
 * fetchTopMovies requests for a list of top movies that have locations in the given list of geohashes
 * @param geohashes: an array of strings representing the current geohashes with locations in the map viewport
 * @param append: (optional param) If set to true the results will be append to the list of top movies, if false top movies will be overriden with the results.
 */
export function fetchTopMovies(geohashes=[], append=false) {
  return async function (dispatch, getState) {
    const { movieInfo: { topMoviesPageSize, topMovies }} = getState();

    // don't do anything if there aren't any movie ids showing
    if (geohashes.length === 0) {
      return;
    }

    // if offset is not provided, go off the current length of topMovies
    let offset = Object.keys(topMovies).length;
    if (!append) {
      offset = 0;
    }
    const size = topMoviesPageSize;

    dispatch(requestTopMovies(geohashes, offset, size, append));

    const { domain } = getState();

    let newTopMovies = [];

    try {
      const response = await fetch(
        `${domain}/top-movies?geohashes=${geohashes.join(',')}&offset=${offset}&limit=${size}`
      );

      newTopMovies = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting ${size} top movies from ${offset}\n${err}`);
    }

    if (append) {
      dispatch(updateTopMovies(newTopMovies));
    } else {
      dispatch(setTopMovies(newTopMovies));
    }
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

export function showMovieInfo() {
  return {
    type: SHOW_MOVIE_INFO
  };
}

export function hideMovieInfo() {
  return {
    type: HIDE_MOVIE_INFO
  };
}
