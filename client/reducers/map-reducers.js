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
    case actions.REQUEST_SPECIFIC_MOVIE_LOCATION_CLUSTERS:
      return state;
    case actions.SET_MAP_MARKERS: {
      const markers = {};

      for (const cluster of action.locationClusters) {
        markers[cluster.id] = {
          id: cluster.id,
          count: cluster.numLocations,
          coordinate: cluster.center,
          locations: cluster.locations,
          highlighted: false,
        };
      }

      const geohashes = action.locationClusters.map((cluster) => cluster.id);

      return {
        ...state,
        markers,
        geohashesShowing: geohashes
      };
    }
    case actions.HIGHLIGHT_MARKER:
      // set the "highlighted" field to true for the marker that has the given location id
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
    case actions.UNHIGHLIGHT_MARKER: {
      // set all markers "highlighted" field to false
      const newMarkers = {...state.markers};
      for (const markerId of Object.keys(newMarkers)) {
        newMarkers[markerId].highlighted = false;
      }

      return {
        ...state,
        markers: newMarkers
      };
    }
    case actions.FOCUS_LOCATION:
      return {
        ...state,
        viewport: {
          center: action.movieLocation.point,
          zoom: 19,
        },
        focusedLocationId: action.movieLocation.id,
      };
    case actions.UNFOCUS_LOCATION: {
      return {
        ...state,
        focusedLocationId: null,
      };
    }
    default:
      return state;
  }
}
