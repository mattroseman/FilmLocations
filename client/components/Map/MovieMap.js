import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  setMapBounds,
  fetchMapMarkers,
} from '../../actions';

import { Map, TileLayer } from 'react-leaflet';

import ClusterMarker from './ClusterMarker.js';
import LocationMarker from './LocationMarker.js';


export default function MovieMap() {
  const dispatch = useDispatch();

  const map = useRef(null);

  const initialCenter = useSelector(state => state.map.initialViewport.center, shallowEqual);
  const initialZoom = useSelector(state => state.map.initialViewport.zoom);

  // initialize map by setting bounds and fetching initial map markers
  useEffect(() => {
    // get initial bounds from the leafletElement
    const bounds = map.current.leafletElement.getBounds();
    dispatch(setMapBounds(bounds));

    dispatch(fetchMapMarkers(bounds, initialZoom));
  }, []);

  // get a list of marker ids. Cluster markers have more than one location, and location markers just have one location.
  const clusterMarkerIds = useSelector(state => {
    return Object.values(state.map.markers).filter(marker => {
      return marker.count > 1;
    }).map(marker => marker.id);
  }, shallowEqual);
  const locationMarkerIds = useSelector(state => {
    return Object.values(state.map.markers).filter(marker => {
      return marker.count === 1;
    }).map(marker => marker.id);
  }, shallowEqual);

  /*
   * handleClusterMarkerClick should be fired whenever a marker is clicked on. It zooms the map onto the clicked upon marker
   * @param markerLocations: a list [[lat, lon],...] location points that make up the marker
   */
  function handleClusterMarkerClick(markerLocations) {
    const leafletElement = map.current.leafletElement;
    leafletElement.fitBounds(markerLocations.map((markerLocation) => {
      return markerLocation.coordinate;
    }), { padding: [80, 80] });
  }

  const specificMovieId = useSelector(state => state.specificMovie == null ? null : state.specificMovie.id);
  const specificMovieLocations = useSelector(
    state => state.specificMovie == null ? [] : state.specificMovie.locations.map(l => l.point),
    shallowEqual
  );
  const specificMovieWasSet = useRef(false);

  // update the map for when specific movie is set or unset
  useEffect(() => {
    const leafletElement = map.current.leafletElement;

    if (specificMovieId != null) {
      // if specificMovie was set zoom the map to fit the locations of the specific movie
      leafletElement.fitBounds(specificMovieLocations, { padding: [80, 80] });
      specificMovieWasSet.current = true;
    } else if (specificMovieWasSet.current) {
      // if specific movie was unset, refetch the markers for the current bounds
      dispatch(fetchMapMarkers(leafletElement.getBounds(), leafletElement.getZoom()));

      specificMovieWasSet.current = false;
    }
  }, [specificMovieId]);

  const focusedPoint = useSelector(state => state.map.focusedLocation != null ? state.map.focusedLocation.point : null);
  // if a specific point is focused (like a location is clicked on from the movie info panel) set the map to zoom in on that point
  useEffect(() => {
    if (focusedPoint != null) {
      const leafletElement = map.current.leafletElement;
      leafletElement.setView(focusedPoint, 19);
    }
  }, [focusedPoint]);

  return (
    <Map
      ref={map}
      worldCopyJump={true}
      minZoom={window.screen.width < 576 ? 2 : 4}
      maxZoom={20}
      zoomControl={window.screen.width >= 576}
      center={initialCenter}
      zoom={initialZoom}
      onViewportChanged={(newViewport) => {
        // grab the new bounds from the leafletElement dynamic property
        const leafletElement = map.current.leafletElement;
        const bounds = leafletElement.getBounds();
        dispatch(setMapBounds(bounds));

        dispatch(fetchMapMarkers(bounds, newViewport.zoom, specificMovieId));
      }}
    >
      <TileLayer
        attribution={'&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'}
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />

      {clusterMarkerIds.map((markerId) => {
        if (map.current.leafletElement.getZoom() < 20) {
          return (
            <ClusterMarker
              key={markerId}
              markerId={markerId}
              onClusterMarkerClick={handleClusterMarkerClick}
            ></ClusterMarker>
          );
        } else {
          // if the zoom level is 20 or greater, show everything as a single location marker
          return (
            <LocationMarker
              key={markerId}
              markerId={markerId}
            ></LocationMarker>
          );
        }
      })}

      {locationMarkerIds.map((markerId) => {
        return (
          <LocationMarker
            key={markerId}
            markerId={markerId}
          ></LocationMarker>
        );
      })}
    </Map>
  );
}
