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
        zoom: 14
      },
      markers: []
    };

    this.map = React.createRef();
  }

  componentDidMount() {
    const map = this.map.current;
    if (map !== null) {
      const bounds = map.leafletElement.getBounds();
      const southWest = [bounds._southWest.lat, bounds._southWest.lng];
      const northEast = [bounds._northEast.lat, bounds._northEast.lng];
      this.getLocations(southWest, northEast);
    }
  }

  /*
   * getLocations queries the backend for all locations in the given bounds
   * params southWest: [lat, lon] the lat lon coordinates for the south west corner of the bounds to search for locations in
   * params northEast: [lat, lon] the lat lon coordinates for the north east corner of the bounds to search for locations in
   * @return: a list of lat lon coordinates that are all film locations within the given bounds
   */
  getLocations(southWest, northEast) {
    fetch(`http://localhost:5000/film-clusters?swlat=${southWest[0]}&swlon=${southWest[1]}&nelat=${northEast[0]}&nelon=${northEast[1]}`)
      .then((response) => {
        return response.json();
      }).then((response) => {
        for (const location of response) {
          this.plotLocation(location);
        }
      });
  }

  /*
   * plotLocation takes a location and plots it on the map
   * @params location: { "locationString": "name of location", "locationPoint": [lat, lon] } an object containing location name and it's coordinates
   */
  plotLocation(location) {
    this.setState({
      markers: [...this.state.markers, {
        name: location.locationString,
        coordinate: location.locationPoint
      }]
    });
  }

  render() {
    const markers = this.state.markers.map((marker) => {
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
        <Map center={this.state.map.center} zoom={this.state.map.zoom} ref={this.map}>
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
