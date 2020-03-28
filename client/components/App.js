import React, { useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { useDispatch } from 'react-redux';
import { setDomain } from '../actions';

import MovieMap from './MovieMap/MovieMap.js';
import MovieInfo from './MovieInfo/MovieInfo.js';

import './App.css';

let DOMAIN = '';
// const TOP_MOVIES_LIMIT = 20;

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // initialize DOMAIN to localhost:5000 if running locally, otherwise leave blank
    DOMAIN = window.location.hostname.indexOf('localhost') > -1 ? 'http://localhost:5000' : '';
    dispatch(setDomain(DOMAIN));
  }, []);

  return (
    <div id="app-container">
      <div id="map-container">
        <MovieMap></MovieMap>
      </div>

      <div id="movie-info-container">
        <MovieInfo></MovieInfo>
      </div>
    </div>
  );
}

export default hot(App);
