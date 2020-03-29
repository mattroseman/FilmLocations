import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setSearchTitle, fetchSearchSuggestions, setSearchSuggestions, fetchSpecificMovie, hideMovieInfo } from '../../actions';

import './MovieSearch.css';

export default function MovieSearch() {
  const dispatch = useDispatch();

  const movieTitle = useSelector(state => state.movieInfo.search.title);

  async function handleMovieTitleChange(event) {
    const movieTitle = event.target.value;

    dispatch(setSearchTitle(movieTitle));
    dispatch(fetchSearchSuggestions(movieTitle));
  }

  function handleMovieTitleKeyDown(event) {
    if (event.keyCode === 13) {
      dispatch(setSearchSuggestions([]));

      dispatch(fetchSpecificMovie(movieTitle));

      // hide the movie info panel on mobile
      if (window.screen.width < 576) {
        dispatch(hideMovieInfo());
      }
    }
  }

  const suggestions = useSelector(state => state.movieInfo.search.suggestions, shallowEqual);

  async function handleSuggestionClick(suggestion) {
    dispatch(setSearchTitle(suggestion.title));
    dispatch(setSearchSuggestions([]));

    dispatch(fetchSpecificMovie(suggestion.title));

    // hide the movie info panel on mobile
    if (window.screen.width < 576) {
      dispatch(hideMovieInfo());
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

      <MovieSearchSuggestions
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
      />
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
