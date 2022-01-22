import React, { useCallback, useState } from "react";
import { mat4 } from 'gl-matrix';
import Hammer from 'hammerjs';
import { CameraConstraints } from "./camera_constraints.js";
import { ContrastScreen } from "./contrast_screen.js";  
import { pinchZoom } from './zoom.js';
import { useLocalStorageState, useSignal } from "./hooks.js";
import { ImageFormat, png } from "./settings.js";

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

function unFuck(setState) {
  return newState => setState(() => newState);
}

export function App({filePrefix="Contrast Visor capture"}) {

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState(0);
  const [projection, setProjection] = useState();
  const [videoConstraints, setVideoConstraints] = useLocalStorageState(
    'contrast-visor.settings.videoConstraints',
    {
    width: { ideal: 4096, max: 4096 },
    height: { ideal: 4096, max: 4096 }
  });
  const [imageFormat, setImageFormat] = useLocalStorageState(
    'contrast-visor.settings.imageFormat',
    png);
  const [captureSignal, setCaptureSignal] = useSignal();

  var className = "wrapper maximal " + (settingsOpen ? "settingsOpen" : "settingsClosed");

  const currentMode = modes[mode % modes.length];

  const [current] = useState({});
  current.tap = useCallback(() => {
    setCaptureSignal({
      type: imageFormat.value,
      fileName: filePrefix + ' ' + new Date().toJSON().replace('T', ' ').replaceAll(':', '.') + imageFormat.extension});
  }, [imageFormat, filePrefix]);

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

    mc.on('tap', () => current.tap());

    function getHorizontal() {
      return window.getComputedStyle(screen).getPropertyValue('--cv-horizontal-layout');
    }

    function byLayout(gesture1, gesture2, action1, action2) {
      mc.on(gesture1, () => getHorizontal() ? action1() : action2());
      mc.on(gesture2, () => getHorizontal() ? action2() : action1());
    }

    byLayout('swipeleft', 'swipedown', () => setSettingsOpen(true), () => setMode(nextMode));
    byLayout('swiperight', 'swipeup', () => setSettingsOpen(false), () => setMode(prevMode));

    pinchZoom(screen, mc, unFuck(setProjection));
  }, []);

  return <div className={className}>
    <div ref={screenRef} className="screen maximal">
      <ContrastScreen videoConstraints={videoConstraints} projection={projection} {...currentMode} captureSignal={captureSignal} />
    </div>
    <div className="settings">
      <CameraConstraints constraints={videoConstraints} onChange={setVideoConstraints} />

      <label>
        Image format:
        <ImageFormat value={imageFormat} onChange={setImageFormat} />
      </label>
    </div>
  </div>
}