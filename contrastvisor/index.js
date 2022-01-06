import * as twgl  from 'twgl.js';
import { mat4, vec3 } from 'gl-matrix';
import Hammer from 'hammerjs';
import {
  matrixFrom,
  decorStretcher
} from './la.js';
import { Camera } from './camera.js';
import { StatSampler } from './stat_sampler.js';
import { Screen } from './screen.js';
import { range } from './prelude.js'

const nsamples = 1000;


const camera = new Camera();
const canvas = document.getElementById('screen');
const errors = document.getElementById('errors');
const downloader = document.getElementById('downloader');

function reportError(err) {
  console.log(err);

  var div = document.createElement('div');
  var text = document.createTextNode(err);
  div.appendChild(text);
  errors.appendChild(div);
}

camera.onError = reportError;

function download(canvas, prefix) {
  downloader.setAttribute('download', prefix + ' ' + new Date().toJSON().replace('T', ' ').replaceAll(':', '.') + '.png');
  downloader.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
  downloader.click();
}


function sumsToCov(s) {
  // Convert a 4x4 matrix containing the outer product of sampled pixels with themselves
  // into a covariance matrix
  const n = s(3,3);
  const e = (i, j) => (s(i, j) - s(i, 3)*s(3, j)/n)/(n-1)
  return matrixFrom(3, 3, e);
}


const negative = mat4.fromValues(
  -1, 0, 0, 0,
  0, -1, 0, 0,
  0, 0, -1, 0,
  1, 1, 1, 1
);

var mode = 0;
const modes = [{
  decor: {}
}, {
}, {
  post: negative,
}, {
  decor: {},
  post: negative,
}];


function nextMode() {
  mode = (mode + 1) % modes.length;
}

function prevMode() {
  mode = (mode + modes.length - 1) % modes.length;
}

function makeRender() {
  const gl = canvas.getContext('webgl2');
  twgl.addExtensionsToContext(gl);
  if (!gl.getExtension('EXT_float_blend')) {
    reportError("Could not get WebGL extenstion EXT_float_blend")
  }

  const texture =  twgl.createTexture(gl, {
    mag: gl.LINEAR,
    min: gl.LINEAR,
    src: [0,0,255,255]
  });

  var lastFrame = {
    width: 1,
    height: 1
  };

  var colorTransformation = mat4.create();
  
  const statSampler = new StatSampler(gl, nsamples);
  const screen = new Screen(gl);

  function render(now, frame) {
    if (frame) {
      lastFrame = frame;

      camera.capture(gl, texture);
      
      var pixels = statSampler.sample(texture);
      const sums = (i,j) => pixels[i*4 + j];
      var cov = sumsToCov(sums);
      var means = vec3.fromValues(sums(0,3)/sums(3,3), sums(1,3)/sums(3,3), sums(2,3)/sums(3,3))

      var t = mat4.create();
      if (modes[mode].decor) {
        t = decorStretcher(cov, means, modes[mode].decor);
      }

      if (modes[mode].post) {
        mat4.multiply(t, modes[mode].post, t);
      }

      colorTransformation = t;
    }

    screen.display(colorTransformation, texture, lastFrame.width, lastFrame.height);

    camera.requestVideoFrameCallback(render);
  }
  return render;
}

function requestStream(e) {
  // 4096x4096 is usually the largest webgl texture size
  const constraints = {
    audio: false,
    video: {
      width: { ideal: 4096, max: 4096 },
      height: { ideal: 4096, max: 4096 },
      facingMode: { ideal: 'environment' }
    }
  };

  camera.change(constraints);
}

requestStream();
const render = makeRender();
requestAnimationFrame(now => render(now, null));


var mc = new Hammer.Manager(canvas, {
	recognizers: [
    [Hammer.Tap],
    [Hammer.Swipe]
  ],
  touchAction: 'pinch-zoom'
});

mc.on('tap',
  _ => {
    render(null, null)
    download(canvas, 'Contrast Visor capture')
  }
)
mc.on('swipeleft', nextMode);
mc.on('swipeup', nextMode);
mc.on('swipedown', prevMode);
mc.on('swiperight', prevMode);

// Register service worker to control making site work offline

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(registration => {
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
