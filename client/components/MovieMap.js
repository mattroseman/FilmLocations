import React, { useContext, useState, useEffect, useRef } from 'react';

import { Map, TileLayer } from 'react-leaflet';

import { DomainContext } from './Context.js';
import ClusterMarker from './ClusterMarker.js';
import LocationMarker from './LocationMarker.js';

import './MovieMap.css';

export default function MovieMap(props) {
  const domain = useContext(DomainContext);

  // if parent element has set a specific viewport to show
  useEffect(() => {
    if (props.locations === null) {
      updateMarkers();
    }
  }, [props.viewport]);

  // if parent element gives a list of locations to mark
  useEffect(() => {
    if (props.locations !== null) {
      showLocations(props.locations);
    }
  }, [props.locations]);

  const [markers, setMarkers] = useState([]);

  const map = useRef(null);

  /*
   * showLocations changes the maps viewport to show the given list of locations and puts a marker at each spot
   */
  function showLocations(locations) {
    const locationsWithPoints = locations.filter((location) => {
      return location.point !== null && location.point !== undefined;
    });

    // create a new markers array for each location
    const newMarkers = locationsWithPoints.map((location) => {
      return {
        id: location.id,
        count: 1,
        coordinate: location.point,
        locations: [{locationString: location.locationString}],
      };
    });


    const leafletElement = map.current.leafletElement;
    leafletElement.fitBounds(locationsWithPoints.map((location) => {
      return location.point
    }));

    setMarkers(newMarkers);
  }

  /*
   * updateMarkers gets all the clusters for the current bounds and zoom level, then plots them
   */
  async function updateMarkers() {
    const southWest = props.viewport.bounds.southWest;
    const northEast = props.viewport.bounds.northEast;
    const zoomLevel = props.viewport.zoom;

    // if the bounds havn't been set yet, don't try and get clusters
    if (southWest.length === 0 || northEast.length === 0) {
      return;
    }

    const clusters = await getClusters(southWest, northEast, zoomLevel);

    plotClusters(clusters);

    const movieIdsShowing = await getMovieIdsShowing(clusters);
    props.onMovieIdsShowingUpdate(movieIdsShowing);
  }

  /*
   * getMovieIdsShowing takes an array of clusters and parses out a single array of all unique movie ids
   * @param clusters: an array of cluster objects
   *  [{
   *    id: <cluster id>,
   *    numLocations: <how many locations are in this cluster>,
   *    center: [lat, lon],
   *    movies: [<movie ids>]
   *  }]
   * @return: an array of unique movie ids from the given clusters
   */
  async function getMovieIdsShowing(clusters) {
    const movieIds = clusters.reduce((movieIds, cluster) => {
      return [...movieIds, ...cluster.movies];
    }, []);

    return Array.from(new Set(movieIds));
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
    const horizontalMargin = Math.abs(northEast[1] - southWest[1]) * .2;
    const verticalMargin = Math.abs(northEast[0] - southWest[0]) * .2;
    try {
      const response = await fetch(`${domain}/film-clusters?swlat=${southWest[0] - verticalMargin}&swlon=${southWest[1] - horizontalMargin}&nelat=${northEast[0] + verticalMargin}&nelon=${northEast[1] + horizontalMargin}&zoom=${zoomLevel}`)
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
    // create a new markers array for the state
    const newMarkers = clusters.map((cluster) => {
      return {
        id: cluster.id,
        count: cluster.numLocations,
        coordinate: cluster.center,
        locations: cluster.locations,
      };
    });

    setMarkers(newMarkers);
  }


  /*
   * handleViewportChanged updates the maps viewport state whenever it changes
   */
  function handleViewportChanged() {
    const leafletElement = map.current.leafletElement;
    const bounds = leafletElement.getBounds();
    props.onViewportChanged({
      center: leafletElement.getCenter(),
      zoom: leafletElement.getZoom(),
      bounds: {
        southWest: [bounds._southWest.lat, bounds._southWest.lng],
        northEast: [bounds._northEast.lat, bounds._northEast.lng]
      }
    });
  }

  return (
    <Map
      ref={map}
      worldCopyJump={true}
      viewport={props.viewport}
      onViewportChanged={handleViewportChanged}
      minZoom={4}
      maxZoom={20}
      whenReady={handleViewportChanged}
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
