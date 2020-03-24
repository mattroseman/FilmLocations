import * as actions from '../actions';
import initialState from '../state/initial-state.js';

export default function map(state=initialState.map, action) {
  switch(action.type) {
    case actions.SET_MAP_VIEWPORT:
      return {
        ...state,
        viewport: action.viewport
      };
    case actions.SET_MAP_BOUNDS:
      return {
        ...state,
        bounds: action.bounds
      };
    case actions.REQUEST_LOCATION_CLUSTERS:
      return state;
    case actions.SET_MAP_MARKERS:
      return {
        ...state,
        markers: action.markers
      };
    default:
      return state;
  }
}
