import React from 'react';

import { Marker, Popup } from 'react-leaflet';

import './LocationMarker.css';

function LocationMarker(props) {
  return (
    <Marker
      position={props.marker.coordinate}
      icon={L.divIcon({
        html: '<i class="fa fa-map-marker fa-3x" aria-hidden="true"></i>',
        iconSize: 25,
        className: props.highlighted ? 'location-marker-icon highlighted' : 'location-marker-icon',
      })}
      onClick={() => console.log(props.marker.locations[0].locationString)}
    >
      <Popup autoPan={false}>
        {props.marker.locations[0].locationString}
      </Popup>
    </Marker>
  );
}

export default LocationMarker;
