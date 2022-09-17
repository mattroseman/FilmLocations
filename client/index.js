import React from 'react';
import { createRoot } from 'react-dom/client';

import { createStore, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';

import filmLocationsApp from './reducers';

import App from './components/App.js';

const composeEnhancers = typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'undefined' ? compose : window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
  trace: true,
  traceLimit: 25
});

const store = createStore(
  filmLocationsApp,
  composeEnhancers(
    applyMiddleware(
      thunkMiddleware
    )
  )
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
