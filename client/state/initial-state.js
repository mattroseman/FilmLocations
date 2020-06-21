const initialState = {
  map: {
    viewport: {
      center: [41.5, -81.6864795],
      zoom: 14,
    },
    bounds: {
      southWest: [undefined, undefined],
      northEast: [undefined, undefined]
    },
    geohashesShowing: [],
    markers: {},
    focusedLocationId: null,
  },
  movieInfo: {
    showing: false,
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

export default initialState;
