/*
 * ACTION TYPES
 */

export const SET_LOCATIONS_SHOWING = 'SET_LOCATIONS_SHOWING';

/*
 * ACTION CREATORS
 */

export function setLocationsShowing(clusters) {
  return {
    type: SET_LOCATIONS_SHOWING,
    locations
  };
}
