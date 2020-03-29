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
    case actions.HIGHLIGHT_MARKER:
      // get the marker that has the given id
      for (const marker of Object.values(state.markers)) {
        for (const markerLocation of marker.locations) {
          if (markerLocation.id === action.locationId) {
            return {
              ...state,
              markers: {
                ...state.markers,
                [marker.id]: {
                  ...state.markers[marker.id],
                  highlighted: true
                }
              }
            };
          }
        }
      }

      // if no marker is found that has the given location id, don't change anything
      return state;
    case actions.UNHIGHLIGHT_MARKER:
      // get the marker that has the given id
      for (const marker of Object.values(state.markers)) {
        for (const markerLocation of marker.locations) {
          if (markerLocation.id === action.locationId) {
            return {
              ...state,
              markers: {
                ...state.markers,
                [marker.id]: {
                  ...state.markers[marker.id],
                  highlighted: false
                }
              }
            };
          }
        }
      }

      // if no marker is found that has the given location id, don't change anything
      return state;
    default:
      return state;
  }
}
