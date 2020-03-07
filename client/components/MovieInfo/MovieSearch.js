import React, { useState } from 'react';

import './MovieSearch.css';

export default function MovieSearch(props) {
  const [movieTitle, setMovieTitle] = useState('');

  function handleMovieTitleChange(event) {
    const newMovieTitle = event.target.value;

    setMovieTitle(newMovieTitle);

    // TODO query backend to get autocomplete suggestions for what was just typed
  }

  function handleMovieTitleSearch() {
    props.onShowSpecificMovie(movieTitle);
  }

  return (
    <div id='movie-search'>
      <input
        id='movie-search-field'
        type='text'
        onChange={handleMovieTitleChange}
        value={movieTitle}
        placeholder='Search Movies'
      />

      <div id='movie-search-autocomplete'>
      </div>
    </div>
  );
}
