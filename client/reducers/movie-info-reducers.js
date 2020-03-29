import * as actions from '../actions';
import initialState from '../state/initial-state.js';

export default function movieInfo(state=initialState.movieInfo, action) {
  switch(action.type) {
    case actions.SET_MOVIE_IDS_SHOWING: {
      const newTopMovies = {...state.topMovies};

      // remove any top movies that aren't in the new movie ids showing array
      for (const topMovieId of Object.keys(newTopMovies)) {
        if (action.movieIdsShowing.indexOf(topMovieId) < 0) {
          delete newTopMovies[topMovieId];
        }
      }

      return {
        ...state,
        movieIdsShowing: action.movieIdsShowing,
        topMovies: newTopMovies
      }
    }
    case actions.REQUEST_TOP_MOVIES:
      return {
        ...state,
        isLoading: true
      };
    case actions.UPDATE_TOP_MOVIES: {
      const topMoviesObj = {};

      // convert the array of topMovies to an object
      // and include the numLocationsShowing property
      for (const topMovie of action.topMovies) {
        topMoviesObj[topMovie.id] = {
          showDefaultNumLocations: true,  // this property is the default, but can be overwritten if topMovie has something set
          ...topMovie
        }
      }

      return {
        ...state,
        isLoading: false,
        topMovies: {
          ...state.topMovies,
          ...topMoviesObj
        }
      }
    }
    case actions.SHOW_ALL_TOP_MOVIE_LOCATIONS:
      return {
        ...state,
        topMovies: {
          ...state.topMovies,
          [action.topMovieId]: {
            ...state.topMovies[action.topMovieId],
            showDefaultNumLocations: false
          }
        }
      }
    case actions.SHOW_DEFAULT_TOP_MOVIE_LOCATIONS:
      return {
        ...state,
        topMovies: {
          ...state.topMovies,
          [action.topMovieId]: {
            ...state.topMovies[action.topMovieId],
            showDefaultNumLocations: true
          }
        }
      }
    case actions.SET_SEARCH_TITLE:
      return {
        ...state,
        search: {
          ...state.search,
          title: action.movieTitle
        }
      }
    case actions.REQUEST_SEARCH_SUGGESTIONS:
      return state;
    case actions.SET_SEARCH_SUGGESTIONS:
      return {
        ...state,
        search: {
          ...state.search,
          suggestions: action.suggestions
        }
      }
    case actions.SHOW_MOVIE_INFO:
      return {
        ...state,
        showing: true
      }
    case actions.HIDE_MOVIE_INFO:
      return {
        ...state,
        showing: false
      }
    default:
      return state;
  }
}
