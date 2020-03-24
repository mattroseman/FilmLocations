import React from 'react';

import MovieSearch from './MovieSearch.js';
import MovieList from './MovieList.js';

import './MovieInfo.css';

export default function MovieInfo() {
  return (
    <div id="movie-info">
      <MovieSearch />
      <MovieList />
    </div>
  );
}
