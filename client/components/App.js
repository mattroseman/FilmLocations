import React, { Component } from 'react';
import { hot } from 'react-hot-loader/root';

import { DomainContext } from './Context.js';
import MovieMap from './MovieMap.js';

import './App.css';

let DOMAIN = '';

class App extends Component {
  constructor(props) {
    super(props);

    // initialize DOMAIN to localhost:5000 if running locally, otherwise leave blank
    DOMAIN = window.location.hostname.indexOf('localhost') > -1 ? 'http://localhost:5000' : ''

    this.state = {
      showingMovies: []
    };

    this.handleMoviesShowingUpdate = this.handleMoviesShowingUpdate.bind(this);
  }

  /*
   * handleMoviesShowingUpdate get's info for all the currently showing movies
   * @param newMovieIds: an array of movie ids currently showing
   */
  handleMoviesShowingUpdate(newMovieIds) {
    console.log(`${newMovieIds.length} movies within view`);
    // TODO query for the top movies from within newMovieIds
    // TODO update the top movies state
  }

  render() {
    return (
      <DomainContext.Provider value={DOMAIN}>
        <div id="map-container">
          <MovieMap onMoviesShowingUpdate={this.handleMoviesShowingUpdate}></MovieMap>
        </div>
      </DomainContext.Provider>
    );
  }
}

export default hot(App);
