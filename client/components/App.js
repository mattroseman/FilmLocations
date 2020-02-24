import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';

import { Map, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet';

import './App.css';

/*
const MAX_CIRCLE_MARKER_RADIUS = 50;
const MIN_CIRCLE_MARKER_RADIUS = 5;
*/
const CIRCLE_MARKER_RADII = [
  { max: 10, radius: 20 },
  { max: 30, radius: 25 },
  { max: 100, radius: 30 },
  { max: 500, radius: 40 },
  { max: 1000, radius: 60 },
  { max: Infinity, radius: 80 }
];

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      map: {
        center: [41.5, -81.6864795],
        zoom: 14,
        markers: []
      },
      showingClusters: [],
      maxClusterCount: 0
    };

    this.map = React.createRef();
  }

  componentDidMount() {
    this.updateMapMarkers();
  }

  handleMapMoveEnd() {
    this.updateMapMarkers();
  }

  /*
   * updateMapMarkers gets the new bounds for the Map component, and gets locations in those bounds, then adds markers to the map
   */
  updateMapMarkers() {
    const map = this.map.current;
    const bounds = map.leafletElement.getBounds();
    const southWest = [bounds._southWest.lat, bounds._southWest.lng];
    const northEast = [bounds._northEast.lat, bounds._northEast.lng];
    this.getClusters(southWest, northEast)
      .then((clusters) => {
        this.plotClusters(clusters);
      });
  }

  /*
   * getClusters queries the backend for all clusters in the given bounds
   * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
   * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
   * @return: [{id: <cluster id>, numLocations: <how many locations are in this cluster>, center: [lat, lon]}] an array of cluster objects
   */
  getClusters(southWest, northEast) {
    return new Promise((resolve, reject) => {
      fetch(`http://localhost:5000/film-clusters?swlat=${southWest[0]}&swlon=${southWest[1]}&nelat=${northEast[0]}&nelon=${northEast[1]}`)
        .then((response) => {
          resolve(response.json());
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /*
   * plotClusters takes an array of cluster objects and plots them on the map
   * @params clusters: [{id: <cluster id>, numLocations: <how many locations are in this cluster>, center: [lat, lon]}] an array of objects describing clusters of locations
   */
  plotClusters(clusters) {
    const newMarkers = clusters.map((cluster) => {
      return {
        id: cluster.id,
        count: cluster.numLocations,
        coordinate: cluster.center
      };
    });

    this.setState({
      map: {
        markers: newMarkers
      }
    });
  }

  /*
   * getCircleMarkerRadius calculates what the radius for the circle marker on the map for a cluster with the given number of locations
   * @param numLocations: how many locations are in the cluster this circle marker represents
   * @return: the radius the circle marker should have
   */
  getCircleMarkerRadius(numLocations) {
    for (const range of CIRCLE_MARKER_RADII) {
      const max = range.max;
      const radius = range.radius;

      if (numLocations < max) {
        return radius;
      }
    }
  }

  render() {
    const markers = this.state.map.markers.map((marker) => {
      if (marker.count > 1) {
        return (
          <CircleMarker
            key={marker.id}
            center={marker.coordinate}
            radius={this.getCircleMarkerRadius(marker.count)}
          >
            <Popup>
              {marker.count}
            </Popup>
          </CircleMarker>
        );
      }

      return (
        <Marker key={marker.id} position={marker.coordinate}>
          <Popup>
            {marker.count} locations
          </Popup>
        </Marker>
      );
    });

    return (
      <div id="map-container">
        <Map
          ref={this.map}
          center={this.state.map.center}
          zoom={this.state.map.zoom}
          onMoveend={() => this.handleMapMoveEnd()}
          worldCopyJump={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          />
          {markers}
        </Map>
      </div>
    );
  }
}

export default hot(App);
