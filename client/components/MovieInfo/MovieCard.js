import React from 'react';
import { useSelector } from 'react-redux';

import './MovieCard.css';

export default function MovieCard(props) {
  // don't bother rerendering prop if map changes, it'll get rerendered from parent
  const mapBounds = useSelector(state => state.map.bounds, () => { return true; })

  // sort the given locations by those in the map bounds.
  // if two locations are both in bounds, sort by length of their descriptions
  props.movie.locations.sort((a, b) => {
    if (a.locationPoint !== undefined && b.locationPoint === undefined) {
      return -1;
    } else if (b.locationPoint !== undefined && a.locationPoint === undefined) {
      return 1;
    }

    if (a.locationPoint !== undefined && b.locationPoint !== undefined) {
      const aInBounds = (
        a.locationPoint[0] > mapBounds.southWest[0] && a.locationPoint[0] < mapBounds.northEast[0] &&
        a.locationPoint[1] > mapBounds.southWest[1] && a.locationPoint[0] < mapBounds.northEast[1]
      );
      const bInBounds = (
        b.locationPoint[0] > mapBounds.southWest[0] && b.locationPoint[0] < mapBounds.northEast[0] &&
        b.locationPoint[1] > mapBounds.southWest[1] && b.locationPoint[0] < mapBounds.northEast[1]
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

  const movieLocations = props.movie.locations.slice(0, 3).map((movieLocation) => {
    return (
      <li key={movieLocation._id} className='movie-card-location'>
        <h4 className='movie-card-location-name'>{movieLocation.locationString}</h4>

        <small className='movie-card-location-description'>
          {movieLocation.description !== '' && movieLocation.description}
        </small>
      </li>
    );
  });

  return (
    <div className="movie-card">
      <h3 className="movie-card-title">
        {props.movie.title}
      </h3>

      <ul className="movie-card-locations">
        {movieLocations}
      </ul>
    </div>
  )
}
