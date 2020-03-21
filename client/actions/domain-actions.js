/*
 * ACTION TYPES
 */

export const SET_DOMAIN = 'SET_DOMAIN';

/*
 * ACTION CREATORS
 */

export function setDomain(domain) {
  return {
    type: SET_DOMAIN,
    domain
  };
}
