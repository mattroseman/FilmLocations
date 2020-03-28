import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { showAllTopMovieLocations, showDefaultTopMovieLocations, showSpecificMovie } from '../../actions';

import './MovieCard.css';

export default function MovieCard(props) {
  const dispatch = useDispatch();

  const movie = useSelector(state => state.movieInfo.topMovies[props.movieId], shallowEqual);

  const defaultNumLocationsToShow = useSelector(state => state.movieInfo.topMoviesDefaultNumLocationsToShow, () => {return true;});

  // don't bother rerendering prop if map changes, it'll get rerendered from parent
  const mapBounds = useSelector(state => state.map.bounds, () => { return true; })

  const movieLocations = sortLocations(movie.locations, mapBounds)
    .slice(0, movie.showDefaultNumLocations ? defaultNumLocationsToShow : -1)
    .map((movieLocation) => {
      return (
        <li key={movieLocation._id} className='movie-card-location'>
          <h4 className='movie-card-location-name'>{movieLocation.locationString}</h4>

          <small className='movie-card-location-description'>
            {movieLocation.description !== '' && movieLocation.description}
          </small>
        </li>
      );
    });

  function handleShowSpecificMovie() {
    dispatch(showSpecificMovie(movie));
  }

  function handleToggleShowAllLocations() {
    if (movie.showDefaultNumLocations) {
      dispatch(showAllTopMovieLocations(movie._id));
    } else {
      dispatch(showDefaultTopMovieLocations(movie._id));
    }
  }

  return (
    <div className="movie-card">
      <h3 className="movie-card-title" onClick={handleShowSpecificMovie}>
        {movie.title}
      </h3>

      <ul className="movie-card-locations">
        {movieLocations}
      </ul>

      <div className="movie-card-toggle-show-all-locations" onClick={handleToggleShowAllLocations}>
        {movie.showDefaultNumLocations &&
        "Show All Locations"
        }
        {!movie.showDefaultNumLocations &&
        "Hide All Locations"
        }
      </div>
    </div>
  )
}

function sortLocations(locations, bounds) {
  // sort the given locations by those in the map bounds.
  // if two locations are both in bounds, sort by length of their descriptions
  return locations.sort((a, b) => {
    if (a.locationPoint !== undefined && b.locationPoint === undefined) {
      return -1;
    } else if (b.locationPoint !== undefined && a.locationPoint === undefined) {
      return 1;
    }

    if (a.locationPoint !== undefined && b.locationPoint !== undefined) {
      const aInBounds = (
        a.locationPoint[0] > bounds.southWest[0] && a.locationPoint[0] < bounds.northEast[0] &&
        a.locationPoint[1] > bounds.southWest[1] && a.locationPoint[0] < bounds.northEast[1]
      );
      const bInBounds = (
        b.locationPoint[0] > bounds.southWest[0] && b.locationPoint[0] < bounds.northEast[0] &&
        b.locationPoint[1] > bounds.southWest[1] && b.locationPoint[0] < bounds.northEast[1]
      );

      if (aInBounds && !bInBounds) {
        return -1;
      } else if (bInBounds && !aInBounds) {
        return 1;
      }
    }

    // if both locations are in the map bounds, compare their descriptions
    if (a.description.length > b.description.length) {
      return -1;
    } else if (b.description.length > a.description.length) {
      return 1;
    }

    return 0;
  });
}
