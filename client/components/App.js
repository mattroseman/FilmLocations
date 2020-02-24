import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';

import { Map, TileLayer, Marker, Popup } from 'react-leaflet';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      map: {
        center: [41.5, -81.6864795],
        zoom: 14,
        markers: []
      },
      showingClusters: []
    };

    this.map = React.createRef();
  }

  componentDidMount() {
    this.updateMapMarkers();
  }

  handleMapMoveEnd() {
    this.setState({
      map: {
        markers: []
      },
      showingClusters: []
    }, () => {
      this.updateMapMarkers();
    });
  }

  /*
   * updateMapMarkers gets the new bounds for the Map component, and gets locations in those bounds, then adds markers to the map
   */
  updateMapMarkers() {
    const map = this.map.current;
    if (map !== null) {
      const bounds = map.leafletElement.getBounds();
      const southWest = [bounds._southWest.lat, bounds._southWest.lng];
      const northEast = [bounds._northEast.lat, bounds._northEast.lng];
      this.getClusters(southWest, northEast)
        .then((clusters) => {
          for (const cluster of clusters) {
            this.plotCluster(cluster);
          }
        });
    }
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
   * plotCluster takes a cluster object and plots it on the map
   * @params cluster: {id: <cluster id>, numLocations: <how many locations are in this cluster>, center: [lat, lon]} an object describing a cluster of locations
   */
  plotCluster(cluster) {
    const newMarker = {
      id: cluster.id,
      name: `${cluster.numLocations} locations`,
      coordinate: [cluster.center[1], cluster.center[0]] // TODO this shouldn't be switched here
    };

    // only add this new marker if there isn't already a marker for the given cluster
    if (this.state.showingClusters.indexOf(cluster.id) < 0) {
      this.setState({
        map: {
          markers: [...this.state.map.markers, newMarker]
        },
        showingClusters: [...this.state.showingClusters, cluster.id]
      });
    }
  }

  render() {
    const markers = this.state.map.markers.map((marker) => {
      return (
        <Marker key={marker.id} position={marker.coordinate}>
          <Popup>
            {marker.name}
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
