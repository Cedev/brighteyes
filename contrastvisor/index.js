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

function download(canvas, prefix) {
  downloader.setAttribute('download', prefix + ' ' + new Date().toJSON().replace('T', ' ').replaceAll(':', '.') + '.png');
  downloader.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  downloader.click();
}

ReactDOM.render(<App />, document.getElementById('root'));

// Register service worker to control making site work offline

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js', { scope: '.' }).then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// Code to handle install prompt on desktop

let deferredPrompt;
const addBtn = document.querySelector('.add-button');
addBtn.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  addBtn.style.display = 'block';

  addBtn.addEventListener('click', () => {
    // hide our user interface that shows our web button
    addBtn.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the web prompt');
      } else {
        console.log('User dismissed the web prompt');
      }
      deferredPrompt = null;
    });
  });
});
