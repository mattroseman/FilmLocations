import React from 'react';

import { Marker, Popup } from 'react-leaflet';

import './ClusterMarker.css';

const CIRCLE_MARKER_RADII = [
  { max: 5, radius: 15 },
  { max: 10, radius: 25 },
  { max: 30, radius: 30 },
  { max: 100, radius: 40 },
  { max: 500, radius: 50 },
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
    <Marker
      position={props.marker.coordinate}
      icon={L.divIcon({
        html: `<div class="cluster-marker-count">${props.marker.count}</div>`,
        className: props.highlighted ? 'cluster-marker-icon highlighted' : 'cluster-marker-icon',
        iconSize: 2 * getCircleMarkerRadius(props.marker.count)
      })}
    >
    </Marker>
  );
}

export default ClusterMarker;
