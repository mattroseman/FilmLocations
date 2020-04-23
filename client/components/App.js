import React, { useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { useDispatch, useSelector } from 'react-redux';
import { setDomain, showMovieInfo, hideMovieInfo } from '../actions';

import MovieMap from './MovieMap/MovieMap.js';
import MovieInfo from './MovieInfo/MovieInfo.js';

import './styles.scss';


let DOMAIN = '';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // initialize DOMAIN to localhost:5000 if running locally, otherwise leave blank
    DOMAIN = window.location.hostname.indexOf('localhost') > -1 ? 'http://localhost:5000' : '';
    dispatch(setDomain(DOMAIN));
  }, []);

  let movieInfoShowing = useSelector(state => state.movieInfo.showing);

  function toggleMovieInfo(show) {
    if (show === true || (show === undefined && !movieInfoShowing)) {
      history.pushState({
        movieInfoShowing: true
      }, '');

      dispatch(showMovieInfo());
    } else {
      history.pushState({
        movieInfoShowing: false
      }, '');

      dispatch(hideMovieInfo());
    }
  }

  // hide the movie info panel off the bat on mobile
  useEffect(() => {
    if (window.screen.width >= 576) {
      dispatch(showMovieInfo());
    }
  }, []);

  // initialize the history state
  useEffect(() => {
    if (window.screen.width < 576) {
      history.replaceState({
        movieInfoShowing: false
      }, '');
    } else {
      history.replaceState({
        movieInfoShowing: true
      }, '');
    }
  }, []);

  // handle mouse event outside of movie info panel on mobile
  useEffect(() => {
    if (window.screen.width < 576) {
      // if a mousedown event happens outside the movie info element, close it
      window.addEventListener('mousedown', (event) => {
        const movieInfoElement = document.getElementById('movie-info-container');

        if (!movieInfoElement.contains(event.target) && !movieInfoElement.classList.contains('hidden')) {
          toggleMovieInfo(false);
        }
      });
    }
  }, []);

  // add event listeners to manage browser history
  useEffect(() => {
    window.addEventListener('popstate', (event) => {
      if (event.state.movieInfoShowing) {
        dispatch(showMovieInfo());
      } else {
        dispatch(hideMovieInfo());
      }
    });
  }, []);

  let toggleMovieInfoBtn = (
    <div
      id="toggle-movie-info-btn"
      className={movieInfoShowing ? "hide-movie-info" : "show-movie-info"}
      onClick={() => toggleMovieInfo()}
    >
      {((!movieInfoShowing && window.screen.width >= 576) || (movieInfoShowing && window.screen.width < 576)) &&
      <i className="fa fa-caret-left" aria-hidden="true"></i>
      }

      <span id="toggle-movie-info-btn-text">MovieInfo</span>

      {((movieInfoShowing && window.screen.width >= 576) || (!movieInfoShowing && window.screen.width < 576)) &&
      <i className="fa fa-caret-right" aria-hidden="true"></i>
      }
    </div>
  );

  return (
    <div id="app-container">
      <div id="map-container">
        <MovieMap></MovieMap>

        {toggleMovieInfoBtn}
      </div>

      <div id="movie-info-container" className={movieInfoShowing ? "" : "hidden"}>
        <MovieInfo></MovieInfo>
      </div>
    </div>
  );
}

export default hot(App);
