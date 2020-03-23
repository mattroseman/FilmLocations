import React, { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchTopMovies } from '../../actions';

import MovieCard from './MovieCard.js';

import './MovieList.css';

export default function MovieList() {
  const dispatch = useDispatch();

  const showing = useSelector(state => state.movieInfo.showing);

  const movieIdsShowing = useSelector(state => state.movieInfo.movieIdsShowing, shallowEqual);
  // If the movieIdsShowing state changes, fetchTopMovies from the top
  useEffect(() => {
    // only bother updating component if it's showing
    if (showing) {
      dispatch(fetchTopMovies());
    }
  }, [movieIdsShowing]);

  const loading = useSelector(state => state.movieInfo.isLoading);
  const topMovies = useSelector(state => state.movieInfo.topMovies, shallowEqual);

  /*
   * handleLoadMoreClick is called when the user clicks the load more link at the bottom of the movie list.
   */
  function handleLoadMoreClick() {
    dispatch(fetchTopMovies());
  }

  return (
    <div id="movie-list">
      {topMovies.map((movie) => {
        return <MovieCard key={movie._id} movie={movie} />;
      })}

      {loading &&
      <div id="movie-list-loading" className="loading">
        loading...
      </div>
      }

      {!loading && topMovies.length < movieIdsShowing.length &&
      <div id="movie-list-load-more" onClick={handleLoadMoreClick}>
        Load More Movies
      </div>
      }
    </div>
  );
}
