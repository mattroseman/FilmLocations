import React, { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchTopMovies, unsetSpecificMovie, hideMovieInfo } from '../../actions';

import MovieCard from './MovieCard.js';


export default function MovieList() {
  const dispatch = useDispatch();

  const topMovies = useSelector(state => state.movieInfo.topMovies, shallowEqual);
  const specificMovie = useSelector(state => state.specificMovie, shallowEqual);

  const geohashesShowing = useSelector(state => state.map.geohashesShowing, shallowEqual);
  // if the geohashes showing changes, fetch top movies from the top
  useEffect(() => {
    // only fetch top movies if there isn't a specific movie showing
    if (specificMovie == null) {
      dispatch(fetchTopMovies(geohashesShowing, false));
    }
  }, [geohashesShowing]);

  const loading = useSelector(state => state.movieInfo.isLoading);

  /*
   * handleLoadMoreClick is called when the user clicks the load more link at the bottom of the movie list.
   */
  function handleLoadMoreClick() {
    dispatch(fetchTopMovies(geohashesShowing, true));
  }

  /*
   * handleShowAllMovies is called when the user clicks the show all movies link at th etop of the movie list. (only present if a specific movie is currently showing)
   */
  function handleShowAllMovies() {
    dispatch(unsetSpecificMovie());

    // hide the movie info panel on mobile
    if (window.screen.width < 576) {
      dispatch(hideMovieInfo());
    }
  }

  return (
    <div id="movie-list">
      {specificMovie &&
      <div id="movie-list-show-all-movies" onClick={handleShowAllMovies}>
        Show All Movies
      </div>
      }

      {!loading && Object.keys(topMovies).map((movieId) => {
        return <MovieCard key={movieId} movieId={movieId} />;
      })}

      {loading &&
      <div id="movie-list-loading" className="loading">
        loading...
      </div>
      }

      {!loading && specificMovie == null &&
      <div id="movie-list-load-more" onClick={handleLoadMoreClick}>
        Load More Movies
      </div>
      }
    </div>
  );
}
