import React, { Component } from 'react';

import { Map, TileLayer } from 'react-leaflet';

import { DomainContext } from './Context.js';
import ClusterMarker from './ClusterMarker.js';
import LocationMarker from './LocationMarker.js';

import './MovieMap.css';


class MovieMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      center: [41.5, -81.6864795],
      zoom: 14,
      bounds: {
        southWest: [],
        northEast: []
      },
      markers: []
    }

    this.map = React.createRef();
  }

  componentDidMount() {
    // initialize the markers that should show up in the map
    this.updateMarkers();
  }

  componentDidUpdate() {
    // update the markers that should show up in the map
    this.updateMarkers();
  }

  /*
   * handleMapMoveEnd updates the maps viewport state whenever it changes
   */
  handleMapMoveEnd() {
    const map = this.map.current;
    const bounds = map.leafletElement.getBounds();
    this.setState({
      center: map.leafletElement.getCenter(),
      zoom: map.leafletElement.getZoom(),
      bounds: {
        southWest: [bounds._southWest.lat, bounds._southWest.lng],
        northEast: [bounds._northEast.lat, bounds._northEast.lng]
      }
    });
  }

  /*
   * updateMarkers gets all the clusters for the current bounds and zoom level, then plots them
   */
  async updateMarkers() {
    const southWest = this.state.bounds.southWest;
    const northEast = this.state.bounds.northEast;
    const zoomLevel = this.state.zoom;

    console.log(`zoomLevel: ${zoomLevel}`);

    const clusters = await this.getClusters(southWest, northEast, zoomLevel);

    this.plotClusters(clusters);
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
  async getClusters(southWest, northEast, zoomLevel) {
    let clusters;
    try {
      const response = await fetch(`${this.context}/film-clusters?swlat=${southWest[0]}&swlon=${southWest[1]}&nelat=${northEast[0]}&nelon=${northEast[1]}&zoom=${zoomLevel}`)
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
  plotClusters(clusters) {
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

    this.setState({
      markers: newMarkers,
      showingMovies: newShowingMovies
    });
  }

  render() {
    const markers = this.state.markers.map((marker) => {
      if (marker.count > 1) {
        return (
          <ClusterMarker key={marker.id} marker={marker}></ClusterMarker>
        );
      } else {
        return (
          <LocationMarker key={marker.id} marker={marker}></LocationMarker>
        );
      }
    });

    return (
      <Map
        ref={this.map}
        center={this.state.center}
        zoom={this.state.zoom}
        worldCopyJump={true}
        onMoveend={() => this.handleMapMoveEnd()}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        {markers}
      </Map>
    );
  }
}

MovieMap.contextType = DomainContext;

export default MovieMap;
