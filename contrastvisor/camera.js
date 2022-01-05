import React from 'react';
import ReactDOM from 'react-dom';

function videoCamera() {
  return <video playsInline autoPlay style={{display: 'none'}}></video>
}

export class Camera {

  constructor() {
    this.onError = console.log;

    this.container = document.body.appendChild(document.createElement("div"));
    this.current = null;
    this.currentFrame = null;
    this.mockFrame = null;

    this.changing = false;
    this.nextConstraints = null;

    this.callbacks = [];
  }

  requestVideoFrameCallback(callback) {
    this.callbacks.push(callback);
  }

  videoFrameCallback(now, frame) {
    this.currentFrame = frame;
    var callbacks = this.callbacks;
    this.callbacks = [];
    callbacks.forEach(c => c(now, frame));
    this.watch();
  }

  watch() {
    if (this.current) {
      if (this.current.requestVideoFrameCallback) {
        this.current.requestVideoFrameCallback((n, f) => this.videoFrameCallback(n, f));
      } else {
        requestAnimationFrame(now => this.videoFrameCallback(now, this.mockFrame))
      }
    }
  }

  change(constraints) {
    this.nextConstraints = constraints;
    if (!this.changing) {
      this.startChange();
    }
  }

  startChange() {
    this.changing = true;
    const constraints = this.nextConstraints;
    this.nextConstraints = null;

    navigator.mediaDevices.getUserMedia(constraints).then(s => this.setStream(s)).catch(this.onError).then(() => {
      this.changing = false;
      if (this.nextConstraints) {
        this.startChange();
      }
    });
  }

  setStream(stream) {
    // changing the srcObject on a video element doesn't work
    this.currentFrame = null;
    this.mockFrame = null;
    if (this.current) {
      this.current.srcObject.getTracks().forEach(track => track.stop());
      this.current.srcObject = null;
    }
    this.current = null;
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    ReactDOM.unmountComponentAtNode(this.container);
    const camera = ReactDOM.render(videoCamera(), this.container);
    
    camera.onloadedmetadata = e => {
      this.mockFrame = {
        width: camera.videoWidth,
        height: camera.videoHeight
      }
      console.log([camera.videoWidth, camera.videoHeight, "Camera"]);
    }

    camera.srcObject = stream;
    this.current = camera;

    this.watch();
  }

  capture(gl, texture) {
    if (this.currentFrame) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0,  gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.current);
    }
  }
}