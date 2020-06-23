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

  // const marker = useSelector(state => state.map.markers[props.markerId], shallowEqual);
  const coordinate = useSelector(state => state.map.markers[props.markerId].coordinate, shallowEqual);
  const highlighted = useSelector(state => state.map.markers[props.markerId].highlighted);
  const markerLocation = useSelector(state => state.map.markers[props.markerId].locations[0], shallowEqual);

  // if this location is focused open the popup
  const focusedLocationId = useSelector(state => state.map.focusedLocation != null ? state.map.focusedLocation.id : null);
  useEffect(() => {
    if (markerLocation.id === focusedLocationId) {
      markerRef.current.leafletElement.openPopup();
    }
  }, [focusedLocationId]);

  let popupElement;

  if (markerLocation.placeId != null) {
    popupElement = (
      <Popup
        ref={popupRef}
        className="location-marker-popup"
        autoPan={false}
        onClose={() => dispatch(unfocusLocation())}
      >
        <div className="location-marker-popup-content">
          <div className="location-marker-popup__location-string">
            {markerLocation.locationString}
          </div>

          <a
            className="location-marker-popup__google-maps-link"
            href={`https://www.google.com/maps/place/?q=place_id:${markerLocation.placeId}`}
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
        {markerLocation.locationString}
      </Popup>
    );
  }

  return (
    <Marker
      ref={markerRef}
      position={coordinate}
      icon={L.divIcon({
        html: '<i class="fa fa-map-marker fa-3x" aria-hidden="true"></i>',
        iconSize: 25,
        className: highlighted ? 'location-marker-icon highlighted' : 'location-marker-icon',
      })}
      onClick={() => console.log(markerLocation.locationString)}
    >
      {popupElement}
    </Marker>
  );
}

export default LocationMarker;
