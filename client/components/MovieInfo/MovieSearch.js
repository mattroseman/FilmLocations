import React, { useState, useContext } from 'react';

import { DomainContext } from '../Context.js';

import './MovieSearch.css';

// these are used to cancel previous suggestion requests when a new character is typed
let abortController;
let signal;


export default function MovieSearch(props) {
  const domain = useContext(DomainContext);

  const [movieTitle, setMovieTitle] = useState('');

  const [movieTitleSuggestions, setMovieTitleSuggestions] = useState([]);

  async function handleMovieTitleChange(event) {
    const newMovieTitle = event.target.value;

    setMovieTitle(newMovieTitle);

    // cancel any previous requests
    if (abortController !== undefined) {
      abortController.abort();
    }
    if ('AbortController' in window) {
      abortController = new AbortController();
      signal = abortController.signal;
    }

    if (newMovieTitle === '') {
      setMovieTitleSuggestions([]);
      return;
    }

    // query backend to get autocomplete suggestions for what was just typed
    let suggestions;
    try {
      const response = await fetch(
        `${domain}/movie-titles?prefix=${newMovieTitle}`,
        {signal: signal}
      );
      suggestions = await response.json();
    } catch (err) {
      // AbortError's are expected
      if (err.name === 'AbortError') {
        return;
      }

      console.error(`problem getting suggestions for prefix ${newMovieTitle}\n${err}`);
      return;
    }

    setMovieTitleSuggestions(suggestions);
  }

  async function handleSuggestionClick(suggestion) {
    setMovieTitle(suggestion.title);
    props.onShowSpecificMovie(suggestion.id);

    setMovieTitleSuggestions([]);
  }

  function handleMovieTitleKeyDown(event) {
    if (event.keyCode === 13) {
      props.onShowSpecificMovie(null, movieTitle);

      setMovieTitleSuggestions([]);
    }
  }

  return (
    <div id='movie-search'>
      <input
        id='movie-search-field'
        type='text'
        onChange={handleMovieTitleChange}
        onKeyDown={handleMovieTitleKeyDown}
        value={movieTitle}
        placeholder='Search Movies'
        autoComplete='off'
      />

      <MovieSearchSuggestions suggestions={movieTitleSuggestions} onSuggestionClick={handleSuggestionClick}></MovieSearchSuggestions>
    </div>
  );
}

function MovieSearchSuggestions(props) {
  return (
    <div id='movie-search-suggestions'>
      {props.suggestions.map((suggestion) => {
        return (
          <div key={suggestion.id} className='movie-search-suggestion' onMouseDown={() => {props.onSuggestionClick(suggestion);}}>
            {suggestion.title}
          </div>
        )
      })}
    </div>
  )
}
