import React, { useCallback, useRef, useState, } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect'
import { PromiseSerializer } from './promises.js'


function stopStream(stream) {
  if (stream) {
    stream.getTracks().forEach(track => {
      stream.removeTrack(track);
      track.stop()
    });
  }
}


export function Camera({ constraints, onFrame }) {

  const camera = useRef();
  const frameHandler = useRef();
  frameHandler.current = onFrame;
  const [streamManager] = useState(PromiseSerializer);

  useDeepCompareEffect(() => {
    // Start a new stream
    var streamStarted = navigator.mediaDevices.getUserMedia(constraints);
    var streamDone = streamManager(streamStarted, stream => {
      camera.current.srcObject = stream;
    });
    streamDone.then(stopStream);
  }, [constraints]);

  // Start watching the camera
  const camRef = useCallback(node => {
    camera.current = node;
    
    function videoFrameCallback(now, frame) {
      if (camera.current != node) {
        return;
      }
      try {
        if (frameHandler.current) {
          frameHandler.current(now, frame, node);
        }
      } catch (error) {
        console.error(error);
      }
      watch();
    }

    function watch() {
      node.requestVideoFrameCallback(videoFrameCallback);
    }
    watch();
  }, []);

  return <video ref={camRef} playsInline autoPlay style={{ display: 'none' }}></video>
}
