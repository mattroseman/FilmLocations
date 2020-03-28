import * as actions from '../actions';
import initialState from '../state/initial-state.js';

export default function specificMovie(state=initialState.specificMovie, action) {
  switch(action.type) {
    case actions.REQUEST_SPECIFIC_MOVIE:
      return state;
    case actions.SET_SPECIFIC_MOVIE:
      return action.movie;
    case actions.UNSET_SPECIFIC_MOVIE:
      return null;
    default:
      return state;
  }
}
