import React from 'react';

import './MovieInfo.css';

export default function MovieInfo(props) {
  if (props.loading) {
    return (
      <div id="movie-info" className="loading">
        loading...
      </div>
    )
  }

  return (
    <div id="movie-info">
      {props.movies.map((movie) => {
        movie.locations = movie.locations.map((movieLocation) => {
          return (
            <li key={movieLocation._id} className='movie-info-location'>
              <h4 className='movie-info-location-name'>{movieLocation.locationString}</h4>
              <small className='movie-info-location-description'>{movieLocation.description !== '' && movieLocation.description}</small>
            </li>
          );
        });

        return (
          <div key={movie._id} className="movie-info-card">
            <h3 className="movie-info-title">
              {movie.title}
            </h3>
            <ul className="movie-info-locations">
              {movie.locations}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
