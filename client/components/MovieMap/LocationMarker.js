import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Marker, Popup } from 'react-leaflet';

import {
  unfocusLocation
} from '../../actions';


function LocationMarker(props) {
  const dispatch = useDispatch();

  const marker = useRef(null);
  const popup = useRef(null);

  useEffect(() => {
    marker.current.leafletElement.bindPopup(popup.current.leafletElement);
  }, []);

  // if this location is focused open the popup
  const focusedLocationId = useSelector(state => state.map.focusedLocationId);
  useEffect(() => {
    if (props.marker.locations[0].id === focusedLocationId) {
      marker.current.leafletElement.openPopup();
    }
  }, [focusedLocationId]);

  let popupElement;

  if (props.marker.locations[0].placeId != null) {
    popupElement = (
      <Popup
        ref={popup}
        className="location-marker-popup"
        autoPan={false}
        onClose={() => dispatch(unfocusLocation())}
      >
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
            <i className="fa fa-external-link" aria-hidden="true"></i>
          </a>
        </div>
      </Popup>
    );
  } else {
    popupElement = (
      <Popup
        ref={popup}
        className="location-marker-popup"
        autoPan={false}
        onClose={() => dispatch(unfocusLocation())}
      >
        {props.marker.locations[0].locationString}
      </Popup>
    );
  }

  return (
    <Marker
      ref={marker}
      position={props.marker.coordinate}
      icon={L.divIcon({
        html: '<i class="fa fa-map-marker fa-3x" aria-hidden="true"></i>',
        iconSize: 25,
        className: props.marker.highlighted ? 'location-marker-icon highlighted' : 'location-marker-icon',
      })}
      onClick={() => console.log(props.marker.locations[0].locationString)}
    >
      {popupElement}
    </Marker>
  );
}

export default LocationMarker;
