import { combineReducers } from 'redux';

import * as actions from './actions.js';

const initialState = {
  map: {
    viewport: {
      center: [41.5, -81.6864795],
      zoom: 14,
    },
    bounds: {
      southWest: [undefined, undefined],
      northEast: [undefined, undefined]
    },
    markers: []
  },
  movieInfo: {
    showing: true,
    isLoading: false,
    moviesShowing: [],
    search: {
      title: '',
      suggestions: []
    }
  }
};

function map(state=initialState.map, action) {
  switch(action.type) {
    case actions.SET_MAP_VIEWPORT:
      return {
        ...state,
        ...{
          viewport: action.newViewport
        }
      };
    case actions.SET_MAP_BOUNDS:
      return {
        ...state,
        ...{
          bounds: action.newBounds
        }
      };
    case actions.REQUEST_MAP_MARKERS:
      return state;
    case actions.RECEIVE_MAP_MARKERS:
      return {
        ...state,
        ...{
          markers: action.newMarkers
        }
      };
    default:
      return state;
  }
}

function movieInfo(state=initialState.movieInfo, action) {
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
          moviesShowing: action.newMoviesShowing
        }
      };
    case actions.SET_MOVIE_INFO_SEARCH_TITLE:
      return {
        ...state,
        ...{
          search: {
            title: action.newSearchTitle
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
            suggestions: action.newSearchSuggestions
          }
        }
      };
    default:
      return state;
  }
}

const filmLocationsApp = combineReducers({
  map,
  movieInfo
});

export default filmLocationsApp;
