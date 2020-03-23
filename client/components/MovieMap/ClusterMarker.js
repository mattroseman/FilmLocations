import React from 'react';

import { CircleMarker, Popup } from 'react-leaflet';

const CIRCLE_MARKER_RADII = [
  { max: 10, radius: 20 },
  { max: 30, radius: 25 },
  { max: 100, radius: 30 },
  { max: 500, radius: 40 },
  { max: 1000, radius: 60 },
  { max: Infinity, radius: 80 }
];

/*
 * getCircleMarkerRadius calculates what the radius for the circle marker on the map for a cluster with the given number of locations
 * @param numLocations: how many locations are in the cluster this circle marker represents
 * @return: the radius the circle marker should have
 */
function getCircleMarkerRadius(numLocations) {
  for (const range of CIRCLE_MARKER_RADII) {
    const max = range.max;
    const radius = range.radius;

    if (numLocations < max) {
      return radius;
    }
  }
}

function ClusterMarker(props) {
  return (
    <CircleMarker
      center={props.marker.coordinate}
      radius={getCircleMarkerRadius(props.marker.count)}
    >
      <Popup>
        {props.marker.count}
      </Popup>
    </CircleMarker>
  );
}

export default ClusterMarker;
