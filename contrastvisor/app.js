import React, { useCallback, useState } from "react";
import { mat4 } from 'gl-matrix';
import Hammer from 'hammerjs';
import { CameraConstraints } from "./camera_constraints.js";
import { ContrastScreen } from "./contrast_screen.js";
import {
  mat4translateThenScale2d
} from './la.js';
  
import { pinchZoom } from './zoom.js';

const negative = mat4.fromValues(
  -1, 0, 0, 0,
  0, -1, 0, 0,
  0, 0, -1, 0,
  1, 1, 1, 1
);

const modes = [{
  decor: {}
}, {
}, {
  post: negative,
}, {
  decor: {},
  post: negative,
}];


const nextMode = mode => (mode + 1) % modes.length;

const prevMode = mode => (mode + modes.length - 1) % modes.length;


export function App() {

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState(0);
  const [projection, setProjection] = useState();
  const [videoConstraints, setVideoConstraints] = useState({
    width: { ideal: 1024, max: 4096 },
    height: { ideal: 1024, max: 4096 }
  });

  var className = "wrapper maximal"
  if (settingsOpen) {
    className += " settingsOpen";
  }

  const currentMode = modes[mode % modes.length];

  const screenRef = useCallback(screen => {
    // Set event handlers on the screen
    var mc = new Hammer.Manager(screen, {
      recognizers: [
        [Hammer.Tap, { taps: 2 }],
        [Hammer.Swipe],
        [Hammer.Pinch]
      ],
      touchAction: 'none'
    });

    function getHorizontal() {
      return window.getComputedStyle(screen).getPropertyValue('--cv-horizontal-layout');
    }

    function byLayout(gesture1, gesture2, action1, action2) {
      mc.on(gesture1, () => getHorizontal() ? action1() : action2());
      mc.on(gesture2, () => getHorizontal() ? action2() : action1());
    }

    byLayout('swipeleft', 'swipeup', () => setSettingsOpen(true), () => setMode(nextMode));
    byLayout('swiperight', 'swipedown', () => setSettingsOpen(false), () => setMode(prevMode));

    pinchZoom(screen, mc, function (proj) {
      var positionMatrix = mat4translateThenScale2d(proj.x, proj.y, proj.scale, 1);
      setProjection(positionMatrix);
    });
  }, []);

  return <div className={className}>
    <div ref={screenRef} className="screen maximal">
      <ContrastScreen videoConstraints={videoConstraints} projection={projection} {...currentMode} />
    </div>
    <div className="settings">
      <CameraConstraints constraints={videoConstraints} onChange={setVideoConstraints} />
    </div>
  </div>
}