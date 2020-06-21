import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  setMapViewport,
  setMapBounds,
  fetchMapMarkers,
} from '../../actions';

import { Map, TileLayer } from 'react-leaflet';

import ClusterMarker from './ClusterMarker.js';
import LocationMarker from './LocationMarker.js';


export default function MovieMap() {
  const dispatch = useDispatch();

  const map = useRef(null);

  const viewport = useSelector(state => state.map.viewport, shallowEqual);
  const bounds = useSelector(state => state.map.bounds, shallowEqual);

  const specificMovie = useSelector(state => state.specificMovie, shallowEqual);
  useEffect(() => {
    if (specificMovie) {
      const leafletElement = map.current.leafletElement;
      leafletElement.fitBounds(specificMovie.locations.map((location) => {
        return location.point;
      }), { padding: [80, 80] });
    } else {
      if (
        bounds.southWest[0] !== undefined && bounds.southWest[1] !== undefined &&
        bounds.northEast !== undefined && bounds.northEast[1] !== undefined
      ) {
        dispatch(fetchMapMarkers(bounds, viewport.zoom));
      }
    }
  }, [specificMovie]);

  // update the map bounds, whenever the viewport changes
  useEffect(() => {
    // grab the new bounds from the leafletElement dynamic property
    const leafletElement = map.current.leafletElement;
    const bounds = leafletElement.getBounds();
    dispatch(setMapBounds(bounds));
  }, [viewport]);

  // set the map markers when the bounds change or a specific movie is set/unset
  useEffect(() => {
    if (
      bounds.southWest[0] !== undefined && bounds.southWest[1] !== undefined &&
      bounds.northEast !== undefined && bounds.northEast[1] !== undefined
    ) {
      if (specificMovie) {
        dispatch(fetchMapMarkers(bounds, viewport.zoom, specificMovie.id));
      } else {
        dispatch(fetchMapMarkers(bounds, viewport.zoom));
      }
    }
  }, [bounds]);


  // TODO maybe only check if marker keys change, or if marker count values change since those are the only values that should trigger a rerender here
  let markers = useSelector(state => state.map.markers, shallowEqual);

  function handleClusterMarkerClick(marker) {
    const leafletElement = map.current.leafletElement;
    leafletElement.fitBounds(marker.locations.map((markerLocation) => {
      return markerLocation.coordinate;
    }), { padding: [80, 80] });
  }

  return (
    <Map
      ref={map}
      worldCopyJump={true}
      minZoom={window.screen.width < 576 ? 2 : 4}
      maxZoom={20}
      zoomControl={window.screen.width >= 576}
      viewport={viewport}
      onViewportChanged={(newViewport) => dispatch(setMapViewport(newViewport))}
    >
      <TileLayer
        attribution={'&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'}
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />

      {Object.values(markers).map((marker) => {
        if (marker.count > 1 && viewport.zoom < 20) {
          return (
            <ClusterMarker
              key={marker.id}
              marker={marker} // TODO should just pass in marker id, and the child component should have useSelector for marker object
              onClusterMarkerClick={() => {
                handleClusterMarkerClick(marker);
              }}
            ></ClusterMarker>
          );
        } else {
          return (
            <LocationMarker
              key={marker.id}
              marker={marker}
            ></LocationMarker>
          );
        }
      })}
    </Map>
  );
}
