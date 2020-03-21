import { combineReducers } from 'redux';

import map from './map-reducers.js';
import movieInfo from './movie-info-reducers.js';
import domain from './domain-reducers.js';

const filmLocationsApp = combineReducers({
  map,
  movieInfo,
  domain
});

export default filmLocationsApp;
