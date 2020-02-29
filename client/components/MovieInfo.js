import React from 'react';

import './MovieInfo.css';

export default function MovieInfo(props) {
  return (
    <ul id="movie-info">
      {props.movies.map((movie) => {
        return (
          <li key={movie._id}>{movie.title}</li>
        );
      })}
    </ul>
  );
}
