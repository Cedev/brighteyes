import React, { useCallback, useRef } from "react";

import * as twgl from 'twgl.js';
import { mat3, mat4, vec2, vec3 } from 'gl-matrix';
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect";

import {
  matrixFrom,
  decorStretcher,
  mat4scaleThenTranslate2d
} from './la.js';
import { Camera } from './camera.js';
import { StatSampler } from './stat_sampler.js';
import { Screen } from './screen.js';

const nsamples = 1000;

function sumsToCov(s) {
  // Convert a 4x4 matrix containing the outer product of sampled pixels with themselves
  // into a covariance matrix
  const n = s(3, 3);
  const e = (i, j) => (s(i, j) - s(i, 3) * s(3, j) / n) / (n - 1)
  return matrixFrom(3, 3, e);
}


function oncePerTimestamp(f) {
  var lastTimestamp = undefined;

  return function (timestamp, ...args) {
    if (timestamp != lastTimestamp) {
      lastTimestamp = timestamp;
      return f(timestamp, ...args);
    }
  }
}


export function ContrastScreen(props) {

  const propsRef = useRef();
  propsRef.current = props;

  var {decor, post, projection, videoConstraints} = props;

  const canvas = useRef();
  const renderFrame = useRef();
  const nextFrame = useRef();

  const canvasRef = useCallback(node => {
    canvas.current = node;

    // Initialize canvas, 
    const gl = node.getContext('webgl2');
    twgl.addExtensionsToContext(gl);
    if (!gl.getExtension('EXT_float_blend')) {
      reportError("Could not get WebGL extenstion EXT_float_blend")
    }

    const texture = twgl.createTexture(gl, {
      mag: gl.LINEAR,
      min: gl.LINEAR,
      src: [0, 0, 255, 255]
    });
    
    var lastFrame = {
      width: 1,
      height: 1
    };

    var seenCamera = false;

    const statSampler = new StatSampler(gl, nsamples);
    const screen = new Screen(gl);

    var renderOnce = undefined;
    function render(now) {
      // Unpack current props
      var {decor, post, projection} = propsRef.current

      if (nextFrame.current) {
        // Copy camera to texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nextFrame.current.camera);
        lastFrame = nextFrame.current.frame;
        seenCamera = true;
        nextFrame.current = null;
      }
      
      var positionMatrix = mat4.create();
      var sampleMatrix = mat3.create()
      if (projection) {
        const proj = projection(lastFrame.width/lastFrame.height);
        positionMatrix = mat4scaleThenTranslate2d(proj.toScreen.x, proj.toScreen.y, proj.toScreen.scale);

        const bounds = proj.screenBoundsInImage;
        mat3.translate(sampleMatrix, sampleMatrix, vec2.fromValues(
          1/2 + bounds.left/proj.imageWidth,
          1/2 + bounds.top/proj.imageHeight));
        mat3.scale(sampleMatrix, sampleMatrix, vec2.fromValues(
          (bounds.right - bounds.left)/proj.imageWidth,
          (bounds.bottom - bounds.top)/proj.imageHeight));
      }

      var colorTransformation = mat4.create();
      if (seenCamera) {
        if (decor) {
          var pixels = statSampler.sample(texture, sampleMatrix);
          const sums = (i, j) => pixels[i * 4 + j];
          var cov = sumsToCov(sums);
          var means = vec3.fromValues(sums(0, 3) / sums(3, 3), sums(1, 3) / sums(3, 3), sums(2, 3) / sums(3, 3))

          colorTransformation = decorStretcher(cov, means, decor);
        }

        if (post) {
          mat4.multiply(colorTransformation, post, colorTransformation);
        }
      }
  
      screen.display(colorTransformation, texture, lastFrame.width, lastFrame.height, positionMatrix);
    }
    renderOnce = oncePerTimestamp(render);
    renderFrame.current = renderOnce;
  }, []);

  function requestFrame() {
    if (renderFrame.current) {
      window.requestAnimationFrame(renderFrame.current);
    }
  }

  // Request a new frame when any of the display parameters change
  useDeepCompareEffectNoCheck(requestFrame, [decor, post, projection]);

  function onCameraFrame(now, frame, camera) {
    nextFrame.current = {
      frame: frame,
      camera: camera
    }
    requestFrame();
  }

  return <>
    <canvas ref={canvasRef} className="maximal"></canvas>
    <Camera constraints={{
      audio: false,
      video: videoConstraints,
    }} onFrame={onCameraFrame} />
  </>
}