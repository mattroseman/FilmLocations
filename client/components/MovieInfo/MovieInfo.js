import React from 'react';

import MovieSearch from './MovieSearch.js';
import MovieList from './MovieList.js';

import './MovieInfo.css';

export default function MovieInfo(props) {
  return (
    <div id="movie-info">
      <MovieSearch onShowSpecificMovie={props.onShowSpecificMovie}></MovieSearch>
      <MovieList loading={props.loading} movies={props.movies}></MovieList>
    </div>
  );
}
