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
      topMoviesShowing: [],
      topMoviesLimit: 100
    };

    this.handleMovieIdsShowingUpdate = this.handleMovieIdsShowingUpdate.bind(this);
    this.handleTopMoviesShowingUpdate = this.handleTopMoviesShowingUpdate.bind(this);
  }

  async handleMovieIdsShowingUpdate(movieIdsShowing) {
    console.time('getting movie info from showing ids');
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
          limit: 100
        })
      });
      topMoviesShowing = await response.json();
    } catch (err) {
      console.error(`something wen't wrong getting info on currently showing movies\n${err}`);
      return;
    }
    console.timeEnd('getting movie info from showing ids');

    this.setState({
      topMoviesShowing: topMoviesShowing
    });
  }

  /*
   * handleTopMoviesShowingUpdate is called when the top movies showing has changed
   * @param topMovies: an array of movie objects, sorted by number of votes
   *    [{
   *      _id: <unique id for movie>
   *      title: <title string>
   *      numVotes: <a rating of how popular the movie is>
   *      locations: [<location id>] an array of location ids this movie was shot at
   *    }]
   */
  async handleTopMoviesShowingUpdate(topMovies) {
    this.setState({
      topMoviesShowing: topMovies
    });
  }

  render() {
    return (
      <DomainContext.Provider value={DOMAIN}>
        <div id="map-container">
          <MovieMap
            onMovieIdsShowingUpdate={this.handleMovieIdsShowingUpdate}
            onTopMoviesShowingUpdate={this.handleTopMoviesShowingUpdate}
            toMoviesLimit={this.state.topMoviesLimit}
          >
          </MovieMap>
        </div>
      </DomainContext.Provider>
    );
  }
}

export default hot(App);
