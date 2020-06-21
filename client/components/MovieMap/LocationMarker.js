import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import { Marker, Popup } from 'react-leaflet';

import {
  unfocusLocation
} from '../../actions';


function LocationMarker(props) {
  const dispatch = useDispatch();

  const markerRef = useRef(null);
  const popupRef = useRef(null);

  // bind popup to the marker on first render
  useEffect(() => {
    markerRef.current.leafletElement.bindPopup(popupRef.current.leafletElement);
  }, []);


  const marker = useSelector(state => state.map.markers[props.markerId], shallowEqual);

  // if this location is focused open the popup
  const focusedLocationId = useSelector(state => state.map.focusedLocationId);
  useEffect(() => {
    if (marker.locations[0].id === focusedLocationId) {
      markerRef.current.leafletElement.openPopup();
    }
  }, [focusedLocationId]);

  let popupElement;

  if (marker.locations[0].placeId != null) {
    popupElement = (
      <Popup
        ref={popupRef}
        className="location-marker-popup"
        autoPan={false}
        onClose={() => dispatch(unfocusLocation())}
      >
        <div className="location-marker-popup-content">
          <div className="location-marker-popup__location-string">
            {marker.locations[0].locationString}
          </div>

          <a
            className="location-marker-popup__google-maps-link"
            href={`https://www.google.com/maps/place/?q=place_id:${marker.locations[0].placeId}`}
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
        ref={popupRef}
        className="location-marker-popup"
        autoPan={false}
        onClose={() => dispatch(unfocusLocation())}
      >
        {marker.locations[0].locationString}
      </Popup>
    );
  }

  return (
    <Marker
      ref={markerRef}
      position={marker.coordinate}
      icon={L.divIcon({
        html: '<i class="fa fa-map-marker fa-3x" aria-hidden="true"></i>',
        iconSize: 25,
        className: marker.highlighted ? 'location-marker-icon highlighted' : 'location-marker-icon',
      })}
      onClick={() => console.log(props.marker.locations[0].locationString)}
    >
      {popupElement}
    </Marker>
  );
}

export default LocationMarker;
