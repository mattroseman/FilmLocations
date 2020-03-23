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
    markers: {}
  },
  movieInfo: {
    showing: true,
    isLoading: false,
    movieIdsShowing: [],
    topMovies: {},
    search: {
      title: '',
      suggestions: []
    }
  },
  domain: ''
};

export default initialState;
