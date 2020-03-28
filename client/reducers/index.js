import { combineReducers } from 'redux';

import * as actions from '../actions';
import initialState from '../state/initial-state.js';


import map from './map-reducers.js';
import movieInfo from './movie-info-reducers.js';
import specificMovie from './specific-movie-reducers.js';

const filmLocationsApp = combineReducers({
  map,
  movieInfo,
  specificMovie,
  domain: (state=initialState.domain, action) => {
    switch(action.type) {
      case actions.SET_DOMAIN:
        return action.domain;
      default:
        return state;
    }
  }
});

export default filmLocationsApp;
