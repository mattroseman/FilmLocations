import * as actions from '../actions';
import initialState from '../state/initial-state.js';

export default function locationsShowing(state=initialState.locationsShowing, action) {
  switch(action.type) {
    case actions.SET_LOCATIONS_SHOWING:
      return action.locations;
    default:
      return state;
  }
}
