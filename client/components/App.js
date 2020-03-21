import React, { useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { useDispatch } from 'react-redux';
import { setDomain } from '../actions';

import MovieMap from './MovieMap.js';
import MovieInfo from './MovieInfo/MovieInfo.js';

import './App.css';

let DOMAIN = '';
// const TOP_MOVIES_LIMIT = 20;

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // initialize DOMAIN to localhost:5000 if running locally, otherwise leave blank
    DOMAIN = window.location.hostname.indexOf('localhost') > -1 ? 'http://localhost:5000' : '';
    dispatch(setDomain(DOMAIN));
  }, []);

  return (
    <div id="app-container">
      <div id="map-container">
        <MovieMap></MovieMap>
      </div>

      <div id="movie-info-container">
        {"<MovieInfo></MovieInfo>"}
      </div>
    </div>
  );
}

export default hot(App);

// function App() {
//   useEffect(() => {
//     // initialize DOMAIN to localhost:5000 if running locally, otherwise leave blank
//     DOMAIN = window.location.hostname.indexOf('localhost') > -1 ? 'http://localhost:5000' : '';
//   }, []);
// 
//   // TODO should be able to move this to reducer logic
//   /*
//    * handleMapViewportChanged updates the maps viewport state whenever it changes
//    */
//   function handleMapViewportChanged(newMapViewport) {
//     this.setState({
//       mapViewport: newMapViewport,
//       topMoviesLoading: true
//     });
//   }
// 
//   // TODO should be able to move this to reducer logic
//   /*
//    * handleMovieIdsShowingUpdate is called when the movies id's showing in the MovieMap changes
//    * It get's info for all the movie ids and updates the topMoviesShowing state
//    * @param movieIdsShowing: an array of movie ids that are currently showing
//    */
//   async function handleMovieIdsShowingUpdate(movieIdsShowing) {
//     let topMoviesShowing = [];
// 
//     // get movie info for all the movie ids showing
//     try {
//       const response = await fetch(`${DOMAIN}/top-movies`, {
//         method: 'post',
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           movieIds: movieIdsShowing,
//           limit: TOP_MOVIES_LIMIT
//         })
//       });
//       topMoviesShowing = await response.json();
//     } catch (err) {
//       console.error(`something wen't wrong getting info on currently showing movies\n${err}`);
//       return;
//     }
// 
//     // parse the data, to only include location info within viewbox
//     const bounds = this.state.mapViewport.bounds;
//     topMoviesShowing = topMoviesShowing.map((movie) => {
//       movie.locations = movie.locations.filter((location) => {
//         if (location.locationPoint === undefined) {
//           return false;
//         }
// 
//         return (
//           location.locationPoint[0] > bounds.southWest[0] && location.locationPoint[1] > bounds.southWest[1] &&
//           location.locationPoint[0] < bounds.northEast[0] && location.locationPoint[1] < bounds.northEast[1]
//         );
//       });
// 
//       return movie;
//     }).filter((movie) => {
//       return movie.locations.length > 0;
//     });
// 
//     this.setState({
//       topMoviesShowing: topMoviesShowing,
//       topMoviesLoading: false
//     });
//   }
// 
//   // TODO should be able to move this to reducer logic
//   /*
//    * handleShowSpecificMovie sets a single movie to show on the website.
//    * Queries for the movie data and sets the currently showing movie state
//    */
//   async function handleShowSpecificMovie(id=null, title=null) {
//     // hide the movie info pane if on mobile
//     if (window.screen.width < 576) {
//       this.setState({
//         movieInfoShowing: false
//       });
//     }
// 
//     let movie;
//     let success;
//     try {
//       const response = await fetch(`${DOMAIN}/movie?id=${id}&title=${title}`);
//       const body = await response.json();
//       success = body.success;
//       movie = body.movie;
//     } catch (err) {
//       console.error(`something wen't wrong getting info for movie: id=${id} title=${title}\n${err}`);
//     }
// 
//     if (!success) {
//       // TODO show alert saying this
//       console.log(`movie: id=${id} title=${title} not found`);
//       return;
//     }
// 
//     if (movie.locations.length === 0) {
//       // TODO show alert saying this
//       console.log(`movie: id=${id} title=${title} has no locations`);
//       return;
//     }
// 
//     /*
//     const movieBounds = movie.locations.reduce((movieBounds, location) => {
//       movieBounds.minSouthWest.lat = Math.min(location.point[0], movieBounds.minSouthWest.lat);
//       movieBounds.minSouthWest.lon = Math.min(location.point[1], movieBounds.minSouthWest.lon);
// 
//       movieBounds.maxNorthEast.lat = Math.max(location.point[0], movieBounds.maxNorthEast.lat);
//       movieBounds.maxNorthEast.lon = Math.max(location.point[1], movieBounds.maxNorthEast.lon);
// 
//       return movieBounds;
//     }, {minSouthWest: {lat: Infinity, lon: Infinity}, maxNorthEast: {lat: -Infinity, lon: -Infinity}});
//     */
// 
//     this.setState({
//       specificMovieShowing: movie,
//       topMoviesLoading: false
//     });
//   }
// 
//   // TODO should be able to move this to reducer logic
//   function handleToggleShowMovieInfo() {
//     this.setState({
//       movieInfoShowing: !this.state.movieInfoShowing
//     });
//   }
// 
//   const mobileScreen = window.screen.width < 576;
// 
//   let toggleMovieInfoBtnContent = '< Movie Info';
//   if (mobileScreen) {
//     if (this.state.movieInfoShowing) {
//       toggleMovieInfoBtnContent = 'Movies >';
//     } else {
//       toggleMovieInfoBtnContent = '< Movies';
//     }
//   } else {
//     if (this.state.movieInfoShowing) {
//       toggleMovieInfoBtnContent = 'Movie Info >';
//     } else {
//       toggleMovieInfoBtnContent = '< Movie Info';
//     }
//   }
// 
//   return (
//     <Provider store={store}>
//       <div id="app-container">
//         <DomainContext.Provider value={DOMAIN}>
//           <div id="map-container">
//             <MovieMap
//               viewport={this.state.mapViewport}
//               locations={this.state.specificMovieShowing ? this.state.specificMovieShowing.locations : null}
//               onViewportChanged={this.handleMapViewportChanged}
//               onMovieIdsShowingUpdate={this.handleMovieIdsShowingUpdate}
//               onTopMoviesShowingUpdate={this.handleTopMoviesShowingUpdate}
//               movieInfoShowing={this.state.movieInfoShowing}
//             >
//             </MovieMap>
//           </div>
// 
//           <div id="movie-info-container" className={this.state.movieInfoShowing ? '' : 'hidden'}>
//             <div id="toggle-movie-info-btn" className={this.state.movieInfoShowing ? 'showing' : ''} onClick={this.handleToggleShowMovieInfo}>
//               {toggleMovieInfoBtnContent}
//             </div>
// 
//             {this.state.movieInfoShowing &&
//             <MovieInfo
//               movies={this.state.topMoviesShowing}
//               specificMovie={this.state.specificMovieShowing}
//               loading={this.state.topMoviesLoading}
//               onShowSpecificMovie={this.handleShowSpecificMovie}
//             >
//             </MovieInfo>
//             }
//           </div>
//         </DomainContext.Provider>
//       </div>
//     </Provider>
//   );
// }
// 
