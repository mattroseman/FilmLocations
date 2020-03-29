import React, { useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { useDispatch, useSelector } from 'react-redux';
import { setDomain, showMovieInfo, hideMovieInfo } from '../actions';

import MovieMap from './MovieMap/MovieMap.js';
import MovieInfo from './MovieInfo/MovieInfo.js';

import './App.css';

let DOMAIN = '';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // initialize DOMAIN to localhost:5000 if running locally, otherwise leave blank
    DOMAIN = window.location.hostname.indexOf('localhost') > -1 ? 'http://localhost:5000' : '';
    dispatch(setDomain(DOMAIN));

    // initialize the movie info component as hidden on mobile
    if (window.screen.width < 576) {
      dispatch(hideMovieInfo());
    }
  }, []);

  const movieInfoShowing = useSelector(state => state.movieInfo.showing);

  function handleToggleMovieInfo() {
    if (movieInfoShowing) {
      dispatch(hideMovieInfo());
    } else {
      dispatch(showMovieInfo());
    }
  }

  useEffect(() => {
    if (window.screen.width < 576) {
      // if a mousedown event happens outside the movie info element, close it
      window.addEventListener('mousedown', (event) => {
        const movieInfoElement = document.getElementById('movie-info-container');

        if (!movieInfoElement.contains(event.target) && movieInfoShowing) {
          dispatch(hideMovieInfo());
        }
      });
    }
  }, []);

  return (
    <div id="app-container">
      <div id="map-container">
        <MovieMap></MovieMap>

        <div id="toggle-movie-info-btn" className={movieInfoShowing ? "hide-movie-info" : "show-movie-info"} onClick={handleToggleMovieInfo}>
          {movieInfoShowing ? "Hide Movie Info" : "Show Movie Info"}
        </div>
      </div>

      <div id="movie-info-container" className={movieInfoShowing ? "" : "hidden"}>
        <MovieInfo></MovieInfo>
      </div>
    </div>
  );
}

export default hot(App);
