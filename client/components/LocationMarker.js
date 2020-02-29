import React from 'react';

import { Marker, Popup } from 'react-leaflet';

function LocationMarker(props) {
  return (
    <Marker
      position={props.marker.coordinate}
      onClick={() => console.log(props.marker.locations[0].locationString)}
    >
      <Popup>
        {props.marker.locations[0].locationString}
      </Popup>
    </Marker>
  );
}

export default LocationMarker;
