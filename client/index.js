import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';

import filmLocationsApp from './reducers';

import App from './components/App.js';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
  trace: true,
  traceLimit: 25
}) || compose;
const store = createStore(
  filmLocationsApp,
  composeEnhancers(
    applyMiddleware(
      thunkMiddleware
    )
  )
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
