import * as twgl  from 'twgl.js';
import { mat4, vec3 } from 'gl-matrix';
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

function reportError(err) {
  console.log(err);

  var div = document.createElement('div');
  var text = document.createTextNode(err);
  div.appendChild(text);
  errors.appendChild(div);
}

camera.onError = reportError;

canvas.addEventListener(
  "click",
  _ => {
    mode = (mode + 1) % modes.length;
  }
)

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
  decor: {corr: true}
}, {
}, {
  post: negative,
}, {
  decor: {},
  post: negative,
}];

var colorTransformation = mat4.create();


function makeRender() {
  const gl = canvas.getContext('webgl2');
  twgl.addExtensionsToContext(gl);
  
  console.log([gl.drawingBufferWidth, gl.drawingBufferHeight, "Drawing Buffer"]);

  const texture =  twgl.createTexture(gl, {
    mag: gl.LINEAR,
    min: gl.LINEAR,
    src: [0,0,255,255]
  });
  
  const statSampler = new StatSampler(gl, nsamples);
  const screen = new Screen(gl);

  function render(now, frame) {
    if (frame) {
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
    } else {
      frame = {
        width: gl.canvas.width,
        height: gl.canvas.height
      }
    }

    screen.display(colorTransformation, texture, frame.width, frame.height);

    camera.requestVideoFrameCallback(render);
  }
  return render;
}

function requestStream() {
  console.log([window.innerWidth, window.innerHeight, "Window"]);

  // Needed despite css to get the canvas to render at a high resolution
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ask for the wrong thing for portrait because the phone always gives you the wrong thing
  const portrait = screen.orientation.type.startsWith('portrait');

  const constraints = {
    audio: false,
    video: {
      width: { ideal: portrait ? window.innerHeight : window.innerWidth },
      height: { ideal: portrait ? window.innerWidth : window.innerHeight },
      facingMode: { ideal: 'environment' }
    }
  };

  camera.change(constraints);
}

requestStream();
const render = makeRender();
requestAnimationFrame(now => render(now, null));

window.addEventListener('resize', requestStream);