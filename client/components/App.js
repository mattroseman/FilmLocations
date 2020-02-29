import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';

import { DomainContext } from './Context.js';
import MovieMap from './MovieMap.js';
import MovieInfo from './MovieInfo.js';

import './App.css';

let DOMAIN = '';

class App extends Component {
  constructor(props) {
    super(props);

    // initialize DOMAIN to localhost:5000 if running locally, otherwise leave blank
    DOMAIN = window.location.hostname.indexOf('localhost') > -1 ? 'http://localhost:5000' : ''

    this.state = {
      topMoviesShowing: [],
      topMoviesLimit: 100,
      specificMovie: null
    };

    this.handleMovieIdsShowingUpdate = this.handleMovieIdsShowingUpdate.bind(this);
  }

  /*
   * handleMovieIdsShowingUpdate is called when the movies id's showing in the MovieMap changes
   * It get's info for all the movie ids and updates the topMoviesShowing state
   * @param movieIdsShowing: an array of movie ids that are currently showing
   */
  async handleMovieIdsShowingUpdate(movieIdsShowing) {
    let topMoviesShowing = [];
    try {
      const response = await fetch(`${DOMAIN}/top-movies`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieIds: movieIdsShowing,
          limit: this.state.topMoviesLimit
        })
      });
      topMoviesShowing = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting info on currently showing movies\n${err}`);
      return;
    }

    console.log(`${topMoviesShowing.length} top movies showing`);

    this.setState({
      topMoviesShowing: topMoviesShowing
    });
  }

  render() {
    return (
      <div id="app-container">
        <DomainContext.Provider value={DOMAIN}>
          <div id="map-container">
            <MovieMap
              onMovieIdsShowingUpdate={this.handleMovieIdsShowingUpdate}
              onTopMoviesShowingUpdate={this.handleTopMoviesShowingUpdate}
            >
            </MovieMap>
          </div>
          <div id="movie-info-container">
            <MovieInfo movies={this.state.topMoviesShowing}></MovieInfo>
          </div>
        </DomainContext.Provider>
      </div>
    );
  }
}

export default hot(App);
