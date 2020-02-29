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
  async handleMoviesShowingUpdate(newMovieIds) {
    let movies = [];
    try {
      const response = await fetch(`${DOMAIN}/top-movies`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieIds: newMovieIds,
          limit: 100
        })
      });
      movies = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting info on currently showing movies\n${err}`);
      return;
    }

    console.log(movies.map((movie) => {return movie.title;}));
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
