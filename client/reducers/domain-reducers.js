import * as actions from '../actions';
import initialState from '../state/initial-state.js';

export default function domain(state=initialState.domain, action) {
  switch(action.type) {
    case actions.SET_DOMAIN:
      return action.domain;
    default:
      return state;
  }
}
