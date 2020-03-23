import React, { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchTopMovies } from '../../actions';

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

// export default function MovieList(props) {
//   if (props.specificMovie) {
//     return (
//       <div id="movie-list">
//         <div className="movie-list-card">
//           <h3 className="movie-list-title">
//             {props.specificMovie.title}
//           </h3>
//           <ul className="movie-list-locations">
//             {props.specificMovie.locations.map((movieLocation) => {
//               return (
//                 <li key={movieLocation.id} className='movie-list-location'>
//                   <h4 className='movie-list-location-name'>{movieLocation.locationString}</h4>
//                   <small className='movie-list-location-description'>{movieLocation.description !== '' && movieLocation.description}</small>
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//       </div>
//     )
//   }
//
//   if (props.loading) {
//     return (
//       <div id="movie-list" className="loading">
//         loading...
//       </div>
//     )
//   }
// 
//   return (
//     <div id="movie-list">
//       {props.movies.map((movie) => {
//         const movieLocations = movie.locations.map((movieLocation) => {
//           return (
//             <li key={movieLocation._id} className='movie-list-location'>
//               <h4 className='movie-list-location-name'>{movieLocation.locationString}</h4>
//               <small className='movie-list-location-description'>{movieLocation.description !== '' && movieLocation.description}</small>
//             </li>
//           );
//         });
// 
//         return (
//           <div key={movie._id} className="movie-list-card">
//             <h3 className="movie-list-title" onClick={() => {props.onShowSpecificMovie(movie._id)}}>
//               {movie.title}
//             </h3>
//             <ul className="movie-list-locations">
//               {movieLocations}
//             </ul>
//           </div>
//         );
//       })}
//     </div>
//   );
// }
