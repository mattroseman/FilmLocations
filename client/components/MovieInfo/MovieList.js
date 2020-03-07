import React from 'react';

import './MovieList.css';

export default function MovieList(props) {
  if (props.specificMovie) {
    return (
      <div id="movie-list">
        <div className="movie-list-card">
          <h3 className="movie-list-title">
            {props.specificMovie.title}
          </h3>
          <ul className="movie-list-locations">
            {props.specificMovie.locations.map((movieLocation) => {
              return (
                <li key={movieLocation.id} className='movie-list-location'>
                  <h4 className='movie-list-location-name'>{movieLocation.locationString}</h4>
                  <small className='movie-list-location-description'>{movieLocation.description !== '' && movieLocation.description}</small>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    )
  }

  if (props.loading) {
    return (
      <div id="movie-list" className="loading">
        loading...
      </div>
    )
  }

  return (
    <div id="movie-list">
      {props.movies.map((movie) => {
        const movieLocations = movie.locations.map((movieLocation) => {
          return (
            <li key={movieLocation._id} className='movie-list-location'>
              <h4 className='movie-list-location-name'>{movieLocation.locationString}</h4>
              <small className='movie-list-location-description'>{movieLocation.description !== '' && movieLocation.description}</small>
            </li>
          );
        });

        return (
          <div key={movie._id} className="movie-list-card">
            <h3 className="movie-list-title">
              {movie.title}
            </h3>
            <ul className="movie-list-locations">
              {movieLocations}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
