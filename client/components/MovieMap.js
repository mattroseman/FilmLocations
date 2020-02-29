import React, { useContext, useState, useEffect, useRef } from 'react';

import { Map, TileLayer } from 'react-leaflet';

import { DomainContext } from './Context.js';
import ClusterMarker from './ClusterMarker.js';
import LocationMarker from './LocationMarker.js';

import './MovieMap.css';

export default function MovieMap(props) {
  const domain = useContext(DomainContext);

  const [viewport, setViewport] = useState({
    center: [41.5, -81.6864795],
    zoom: 14,
    bounds: {
      southWest: [],
      northEast: []
    }
  });
  useEffect(() => {
    updateMarkers();
  }, [viewport]);

  const [markers, setMarkers] = useState([]);
  const [showingMovies, setShowingMovies] = useState([]);

  const map = useRef(null);

  /*
   * handleMapMoveEnd updates the maps viewport state whenever it changes
   */
  function handleViewportChange() {
    const leafletElement = map.current.leafletElement;
    const bounds = leafletElement.getBounds();
    setViewport({
      center: leafletElement.getCenter(),
      zoom: leafletElement.getZoom(),
      bounds: {
        southWest: [bounds._southWest.lat, bounds._southWest.lng],
        northEast: [bounds._northEast.lat, bounds._northEast.lng]
      }
    });
  }

  /*
   * updateMarkers gets all the clusters for the current bounds and zoom level, then plots them
   */
  async function updateMarkers() {
    const southWest = viewport.bounds.southWest;
    const northEast = viewport.bounds.northEast;
    const zoomLevel = viewport.zoom;

    console.log(`zoomLevel: ${zoomLevel}`);

    const clusters = await getClusters(southWest, northEast, zoomLevel);

    plotClusters(clusters);
  }

  /*
   * getClusters queries the backend for all clusters in the given bounds
   * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
   * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
   * params zoomLevel: an integer representing how zoomed in the map is (same value leaflet uses)
   * @return:  an array of cluster objects
   *  [{
   *    id: <cluster id>,
   *    numLocations: <how many locations are in this cluster>,
   *    center: [lat, lon],
   *    movies: [<movie ids>]
   *  }]
   */
  async function getClusters(southWest, northEast, zoomLevel) {
    let clusters;
    try {
      const response = await fetch(`${domain}/film-clusters?swlat=${southWest[0]}&swlon=${southWest[1]}&nelat=${northEast[0]}&nelon=${northEast[1]}&zoom=${zoomLevel}`)
      clusters = response.json();
    } catch (err) {
      console.error(`something wen't wrong getting clusters for current map\n${err}`);
      return [];
    }

    return clusters;
  }

  /*
   * plotClusters takes an array of cluster objects and plots them on the map
   * @params clusters: an array of objects describing clusters of locations
   *  [{
   *    id: <cluster id>,
   *    numLocations: <how many locations are in this cluster>,
   *    center: [lat, lon],
   *    movies: [<movie ids>]
   *  }]
   */
  function plotClusters(clusters) {
    // create a new markers array for the state, and also collect all movies that are shown
    let newShowingMovies = [];
    const newMarkers = clusters.map((cluster) => {
      newShowingMovies = newShowingMovies.concat(
        cluster.locations.reduce((movieIds, location) => {
          movieIds = movieIds.concat(location.movies);
          return movieIds;
        }, [])
      );

      return {
        id: cluster.id,
        count: cluster.numLocations,
        coordinate: cluster.center,
        locations: cluster.locations,
      };
    });

    setMarkers(newMarkers);
    setShowingMovies(newShowingMovies);
  }

  return (
    <Map
      ref={map}
      worldCopyJump={true}
      viewport={viewport}
      onViewportChanged={handleViewportChange}
    >
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />
      {markers.map((marker) => {
        if (marker.count > 1) {
          return (
            <ClusterMarker key={marker.id} marker={marker}></ClusterMarker>
          );
        } else {
          return (
            <LocationMarker key={marker.id} marker={marker}></LocationMarker>
          );
        }
      })}
    </Map>
  );
}
