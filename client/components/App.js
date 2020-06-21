import React, { useEffect, useRef } from 'react';
import { hot } from 'react-hot-loader/root';
import { useDispatch, useSelector } from 'react-redux';
import { setDomain, showMovieInfo, hideMovieInfo } from '../actions';

import MovieMap from './Map/MovieMap.js';
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
  const movieInfoContainerElement = useRef(null);

  function toggleMovieInfo(show, updateHistory=true) {
    if (show === true || (show == undefined && !movieInfoShowing)) {
      // show the movie info component
      dispatch(showMovieInfo());

      if (updateHistory) {
        history.pushState({
          movieInfoShowing: true
        }, '');
      }
    } else {
      // hide the movie info component
      dispatch(hideMovieInfo());

      if (updateHistory) {
        history.pushState({
          movieInfoShowing: false
        }, '');
      }
    }
  }

  // handle mouse event outside of movie info panel on mobile
  useEffect(() => {
    if (window.screen.width < 576) {
      // if a mousedown event happens outside the movie info element, close it
      window.addEventListener('mousedown', (event) => {
        if (!movieInfoContainerElement.current.contains(event.target) && !movieInfoShowing) {
          toggleMovieInfo(false);
        }
      });
    }
  }, []);

  // show the movie info panel on render for desktop
  useEffect(() => {
    if (window.screen.width >= 576) {
      dispatch(showMovieInfo(null, false));
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

  // add event listeners to manage browser history
  useEffect(() => {
    window.addEventListener('popstate', (event) => {
      if (event.state.movieInfoShowing) {
        toggleMovieInfo(true, false);
      } else {
        toggleMovieInfo(false, false);
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

      <span id="toggle-movie-info-btn-text">Movie Info</span>

      {((movieInfoShowing && window.screen.width >= 576) || (!movieInfoShowing && window.screen.width < 576)) &&
      <i className="fa fa-caret-right" aria-hidden="true"></i>
      }
    </div>
  );

  return (
    <div id="app-container">
      <div id="map-container">
        <MovieMap></MovieMap>
      </div>

      <div
        id="movie-info-container"
        className={movieInfoShowing ? "" : "hidden"}
        ref={movieInfoContainerElement}
      >
        <MovieInfo></MovieInfo>

        {toggleMovieInfoBtn}
      </div>
    </div>
  );
}

export default hot(App);
