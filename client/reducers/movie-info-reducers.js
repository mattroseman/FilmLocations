import * as actions from '../actions';
import initialState from '../state/initial-state.js';

export default function movieInfo(state=initialState.movieInfo, action) {
  switch(action.type) {
    case actions.HIDE_MOVIE_INFO:
      return {
        ...state,
        ...{
          showing: false
        }
      };
    case actions.SHOW_MOVIE_INFO:
      return {
        ...state,
        ...{
          showing: true
        }
      };
    case actions.REQUEST_MOVIE_INFO_MOVIES_SHOWING:
      return {
        ...state,
        ...{
          isLoading: true
        }
      };
    case actions.RECEIVE_MOVIE_INFO_MOVIES_SHOWING:
      return {
        ...state,
        ...{
          isLoading: false,
          moviesShowing: action.moviesShowing
        }
      };
    case actions.SET_MOVIE_INFO_SEARCH_TITLE:
      return {
        ...state,
        ...{
          search: {
            title: action.searchTitle
          }
        }
      };
    case actions.REQUEST_MOVIE_INFO_SEARCH_SUGGESTIONS:
      return state;
    case actions.RECEIVE_MOVIE_INFO_SEARCH_SUGGESTIONS:
      return {
        ...state,
        ...{
          search: {
            suggestions: action.searchSuggestions
          }
        }
      };
    default:
      return state;
  }
}
