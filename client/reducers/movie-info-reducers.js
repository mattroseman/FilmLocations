import * as actions from '../actions';
import initialState from '../state/initial-state.js';

export default function movieInfo(state=initialState.movieInfo, action) {
  switch(action.type) {
    case actions.SET_MOVIE_IDS_SHOWING:
      return {
        ...state,
        movieIdsShowing: action.movieIdsShowing,
        topMovies: []
      }
    case actions.REQUEST_TOP_MOVIES:
      return {
        ...state,
        isLoading: true
      };
    case actions.UPDATE_TOP_MOVIES:
      return {
        ...state,
        isLoading: false,
        topMovies: [...state.topMovies, ...action.topMovies]
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
    default:
      return state;
  }
}
