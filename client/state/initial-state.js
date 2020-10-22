const initialState = {
  map: {
    initialViewport: {
      center: [41.5, -81.6864795],
      zoom: 14,
    },
    bounds: {
      southWest: [undefined, undefined],
      northEast: [undefined, undefined]
    },
    markers: {},
    geohashesShowing: [],
    focusedPoint: null,
  },
  movieInfo: {
    showing: false,
    shouldUpdate: false,
    isLoading: true,
    topMoviesPageSize: 10,
    topMoviesDefaultNumLocationsToShow: 3,
    topMovies: {},
    search: {
      title: '',
      suggestions: []
    }
  },
  specificMovie: null,
  domain: ''
};

// if this is local, set the domain to localhost:5000, otherwise leave blank and use relative paths
if (window.location.hostname.indexOf('localhost') > -1) {
  initialState.domain = 'http://localhost:5000'
}

export default initialState;
