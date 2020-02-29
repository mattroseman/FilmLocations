import React from 'react';

import './MovieInfo.css';

export default function MovieInfo(props) {
  return (
    <div id="movie-info">
      {props.movies.map((movie) => {
        return (
          <div
            key={movie._id}
            className="movie-info-card"
          >
            {movie.title}
          </div>
        );
      })}
    </div>
  );
}
