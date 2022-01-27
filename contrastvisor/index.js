import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './app.js';

// Assets
import eye162 from './imgs/eye162.png';
import webmanifest from './manifest.webmanifest';

const errors = document.getElementById('errors');
const downloader = document.getElementById('downloader');

function reportError(err) {
  console.log(err);

  var div = document.createElement('div');
  var text = document.createTextNode(err);
  div.appendChild(text);
  errors.appendChild(div);
}


ReactDOM.render(<App />, document.getElementById('root'));

// Register service worker to control making site work offline

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: '.' }).then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// Code to handle install prompt on desktop
