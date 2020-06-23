import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import {
  showAllTopMovieLocations,
  showDefaultTopMovieLocations,
  setSpecificMovie,
  hideMovieInfo,
  highlightMarker,
  unhighlightMarker,
  focusLocation,
} from '../../actions';


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
        <li
          key={movieLocation.id}
          className='movie-card-location'
          onMouseEnter={() => dispatch(highlightMarker(movieLocation.id))}
          onMouseLeave={() => dispatch(unhighlightMarker())}
          onClick={() => dispatch(focusLocation(movieLocation))}
        >
          <h4 className='movie-card-location-name'>{movieLocation.locationString}</h4>

          <small className='movie-card-location-description'>
            {movieLocation.description !== '' && movieLocation.description}
          </small>
        </li>
      );
    });

  function handleShowSpecificMovie() {
    dispatch(setSpecificMovie(movie));

    // hide the movie info panel on mobile
    if (window.screen.width < 576) {
      dispatch(hideMovieInfo());
    }
  }

  function handleToggleShowAllLocations() {
    if (movie.showDefaultNumLocations) {
      dispatch(showAllTopMovieLocations(movie.id));
    } else {
      dispatch(showDefaultTopMovieLocations(movie.id));
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

      {movie.locations.length > defaultNumLocationsToShow &&
      <div className="movie-card-toggle-show-all-locations" onClick={handleToggleShowAllLocations}>
        {movie.showDefaultNumLocations &&
        <span>
          Show All Locations
          <i className="fa fa-caret-down" aria-hidden="true"></i>
        </span>
        }
        {!movie.showDefaultNumLocations &&
        <span>
          Hide All Locations
          <i className="fa fa-caret-up" aria-hidden="true"></i>
        </span>
        }
      </div>
      }
    </div>
  )
}

function sortLocations(locations, bounds) {
  // sort the given locations by those in the map bounds.
  // if two locations are both in bounds, sort by length of their descriptions
  return locations.sort((a, b) => {
    // if a location has a point, and b does not, sort a before b and vice versa
    if (a.point != null && b.point == null) {
      return -1;
    } else if (b.point != null && a.point == null) {
      return 1;
    }

    // if both locations have coordinates
    if (a.point != null && b.point != null) {
      const aInBounds = (
        a.point[0] > bounds.southWest[0] && a.point[0] < bounds.northEast[0] &&
        a.point[1] > bounds.southWest[1] && a.point[1] < bounds.northEast[1]
      );
      const bInBounds = (
        b.point[0] > bounds.southWest[0] && b.point[0] < bounds.northEast[0] &&
        b.point[1] > bounds.southWest[1] && b.point[1] < bounds.northEast[1]
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
