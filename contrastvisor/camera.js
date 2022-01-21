import React, { useCallback, useRef, useState, } from 'react';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect'
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

  useDeepCompareEffectNoCheck(() => {
    streamManager(() => 
      // Start a new stream
      navigator.mediaDevices.getUserMedia(constraints).catch(console.error).then(stream => {
        camera.current.srcObject = stream;
        return () => stopStream(stream);
      })
    );
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
