import React from 'react';

import { Marker, Popup } from 'react-leaflet';


function LocationMarker(props) {
  let popup;

  if (props.marker.locations[0].placeId != null) {
    popup = (
      <Popup className="location-marker-popup" autoPan={false}>
        <div className="location-marker-popup-content">
          <div className="location-marker-popup__location-string">
            {props.marker.locations[0].locationString}
          </div>

          <a
            className="location-marker-popup__google-maps-link"
            href={`https://www.google.com/maps/place/?q=place_id:${props.marker.locations[0].placeId}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            google maps
          </a>
        </div>
      </Popup>
    );
  } else {
    popup = (
      <Popup className="location-marker-popup" autoPan={false}>
        {props.marker.locations[0].locationString}
      </Popup>
    );
  }

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
      {popup}
    </Marker>
  );
}

export default LocationMarker;
