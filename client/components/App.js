import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';

import { Map, TileLayer } from 'react-leaflet';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      map: {
        center: [51.505, -0.09],
        zoom: 13
      }
    };
  }

  render() {
    return (
      <Map center={this.state.map.center} zoom={this.state.map.zoom}>
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
      </Map>
    );
  }
}

export default hot(App);
