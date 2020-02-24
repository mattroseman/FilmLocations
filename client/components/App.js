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
      showingLocations: []
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
    if (map !== null) {
      const bounds = map.leafletElement.getBounds();
      const southWest = [bounds._southWest.lat, bounds._southWest.lng];
      const northEast = [bounds._northEast.lat, bounds._northEast.lng];
      this.getLocations(southWest, northEast)
        .then((filmLocations) => {
          for (const filmLocation of filmLocations) {
            this.plotLocation(filmLocation);
          }
        });
    }
  }

  /*
   * getLocations queries the backend for all locations in the given bounds
   * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
   * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
   * @return: [{locationString: 'name of location', locationPoint: [lat, lon]}] an array of location objects
   */
  getLocations(southWest, northEast) {
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
   * plotLocation takes a location and plots it on the map
   * @params filmLocation: { "locationString": "name of location", "locationPoint": [lat, lon] } an object containing location name and it's coordinates
   */
  plotLocation(filmLocation) {
    const newMarker = {
      name: filmLocation.locationString,
      coordinate: filmLocation.locationPoint
    };

    // only add this new marker if there isn't already a marker for the given location
    if (this.state.showingLocations.indexOf(filmLocation.locationString) < 0) {
      this.setState({
        map: {
          markers: [...this.state.map.markers, newMarker]
        },
        showingLocations: [...this.state.showingLocations, filmLocation.locationString]
      });
    }
  }

  render() {
    const markers = this.state.map.markers.map((marker) => {
      return (
        <Marker key={marker.name} position={marker.coordinate}>
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
