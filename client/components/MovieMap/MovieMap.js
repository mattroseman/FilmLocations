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

import './MovieMap.css';

export default function MovieMap() {
  const dispatch = useDispatch();

  const map = useRef(null);

  const viewport = useSelector(state => state.map.viewport, shallowEqual);
  const bounds = useSelector(state => state.map.bounds, shallowEqual);

  // Invalidate the maps size whenever the movie info panel shows or hides
  const movieInfoShowing = useSelector(state => state.movieInfo.showing);
  useEffect(() => {
    const leafletElement = map.current.leafletElement;
    leafletElement.invalidateSize();
  }, [movieInfoShowing]);

  const specificMovie = useSelector(state => state.specificMovie, shallowEqual);
  useEffect(() => {
    if (specificMovie) {
      const leafletElement = map.current.leafletElement;
      leafletElement.fitBounds(specificMovie.locations.map((location) => {
        return location.point;
      }), { padding: [80, 80] });
    }
  }, [specificMovie]);

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


  let markers = useSelector(state => state.map.markers, shallowEqual);
  const highlightedMarker = useSelector(state => state.map.highlightedMarker);

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
      whenReady={() => {
        const leafletElement = map.current.leafletElement;
        const bounds = leafletElement.getBounds();
        dispatch(setMapBounds(bounds));
      }}
      onViewportChanged={(newViewport) => {
        dispatch(setMapViewport(newViewport));
        // grab the new bounds from the leafletElement dynamic property
        const leafletElement = map.current.leafletElement;
        const bounds = leafletElement.getBounds();
        dispatch(setMapBounds(bounds));
      }}
    >
      <TileLayer
        attribution={'&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'}
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />

      {Object.values(markers).map((marker) => {
        if (marker.count > 1) {
          return (
            <ClusterMarker
              key={marker.id}
              marker={marker}
              highlighted={marker.id === highlightedMarker}
              onClusterMarkerClick={() => {
                handleClusterMarkerClick(marker);
              }}
            ></ClusterMarker>
          );
        } else {
          return (
            <LocationMarker key={marker.id} marker={marker} highlighted={marker.id === highlightedMarker}></LocationMarker>
          );
        }
      })}
    </Map>
  );
}
