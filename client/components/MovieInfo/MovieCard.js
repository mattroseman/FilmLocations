import React from 'react';

import './MovieCard.css';

export default function MovieCard(props) {
  const movieLocations = props.movie.locations.map((movieLocation) => {
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
