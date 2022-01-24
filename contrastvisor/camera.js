import React, { useCallback, useEffect, useRef, useState, } from 'react';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect'
import { useErrorHandler } from './errors.js';
import { FastForwardSerializer } from './promises.js'


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
  const [streamManager] = useState(FastForwardSerializer);

  const errorHandler = useErrorHandler();
  const errorHandlerRef = useRef();
  errorHandlerRef.current = errorHandler;

  useDeepCompareEffectNoCheck(() => {
    streamManager(() =>
      // Start a new stream
      errorHandler.wrapPromise(navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        camera.current.srcObject = stream;
        return errorHandler.wrap(() => stopStream(stream));
      }))
    );
  }, [constraints, errorHandler]);

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
        errorHandlerRef.current.onError(error);
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
