function videoCamera() {
  var camera = document.createElement("video");
  camera.setAttribute("playsInline", "");
  camera.setAttribute("autoPlay", "");
  camera.setAttribute("style", "display: none");
  return camera;
}

export class Camera {

  constructor() {
    this.container = document.body.appendChild(document.createElement("div"));
    this.current = null;
    this.currentData = false;

    this.changing = false;
    this.nextConstraints = null;

    this.callbacks = [];
  }

  requestVideoFrameCallback(callback) {
    this.callbacks.push(callback);
  }

  videoFrameCallback(now, frame) {
    this.currentData = true;
    var callbacks = this.callbacks;
    this.callbacks = [];
    callbacks.forEach(c => c(now, frame));
    this.watch();
  }

  watch() {
    if (this.current) {
      this.current.requestVideoFrameCallback((n, f) => this.videoFrameCallback(n, f));
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

    navigator.mediaDevices.getUserMedia(constraints).then(s => this.setStream(s)).catch(console.log).then(() => {
      this.changing = false;
      if (this.nextConstraints) {
        this.startChange();
      }
    });
  }

  setStream(stream) {
    // changing the srcObject on a video element doesn't work
    this.currentData = false;
    if (this.current) {
      this.current.srcObject.getTracks().forEach(track => track.stop());
      this.current.srcObject = null;
    }
    this.current = null;
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    const camera = videoCamera();
    this.container.appendChild(camera);
    
    camera.onloadedmetadata = e => {
      console.log([camera.videoWidth, camera.videoHeight, "Camera"]);
    }

    camera.srcObject = stream;
    this.current = camera;

    this.watch();
  }

  capture(gl, texture) {
    if (this.currentData) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0,  gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.current);
    }
  }
}