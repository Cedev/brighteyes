import React, { useCallback, useState } from "react";
import { mat4 } from 'gl-matrix';
import Hammer from 'hammerjs';
import { CameraSettings, videoConstraints } from "./camera_constraints.js";
import { ContrastScreen } from "./contrast_screen.js";
import { OverlayErrorLog, ErrorBoundary, ScopeErrors, useErrorHandler, ErrorLogContext, ErrorLog } from "./errors.js";
import { pinchZoom } from './zoom.js';
import { useLocalStorageState, useSignal } from "./hooks.js";
import { DebugSettings, ImageFormat, png, ToggleSetting } from "./settings.js";
import classNames from "classnames";
import { InstallButton } from "./install.js";

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

function setFunction(setState) {
  return newState => setState(() => newState);
}

export function ContrastVisor({ filePrefix = "Contrast Visor capture" }) {

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState(0);
  const [projection, setProjection] = useState();
  const [cameraSettings, setCameraSettings] = useLocalStorageState(
    'contrast-visor.settings.camera', {});
  const [imageFormat, setImageFormat] = useLocalStorageState(
    'contrast-visor.settings.imageFormat',
    png);
  const [renderCamera, setRenderCamera] = useLocalStorageState(
    'contrast-visor.settings.renderCamera',
    false);
  const [captureSignal, setCaptureSignal] = useSignal();
  const [debugSettings, setDebugSettings] = useState();

  const cameraConstraints = videoConstraints(cameraSettings);

  var className = classNames("wrapper", "maximal", { settingsOpen: settingsOpen });

  const currentMode = modes[mode % modes.length];

  const [current] = useState({});
  current.tap = useCallback(() => {
    setCaptureSignal({
      type: imageFormat.value,
      fileName: filePrefix + ' ' + new Date().toJSON().replace('T', ' ').replaceAll(':', '.') + imageFormat.extension
    });
  }, [imageFormat, filePrefix]);

  const screenRef = useCallback(screen => {
    if (screen == null) {
      return;
    }
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

    pinchZoom(screen, mc, setFunction(setProjection));
  }, []);

  return <div className={className}>
    <div ref={screenRef} className={classNames("screen", "maximal", {displayCamera: debugSettings?.displayCamera, renderCamera: renderCamera})}>
      <ErrorBoundary>
        <ContrastScreen videoConstraints={cameraConstraints} projection={projection} {...currentMode} captureSignal={captureSignal} />
      </ErrorBoundary>
    </div>
    <div className="panel">
      <div className="settings">
        <h1>Contrast Visor <span className="versionNumber">{VERSION}</span></h1>
        <CameraSettings settings={cameraSettings} onChange={setCameraSettings} />

        <label>
          Image format:
          <ImageFormat value={imageFormat} onChange={setImageFormat} />
        </label>

        <ToggleSetting value={renderCamera} onChange={setRenderCamera}>
          Render camera (iOS):
        </ToggleSetting>

        <InstallButton>Install</InstallButton>

        <DebugSettings value={debugSettings} onChange={setDebugSettings} />

        <ErrorLogContext.Consumer>
          {errors => <ErrorLog errors={errors} />}
        </ErrorLogContext.Consumer>
      </div>
    </div>
  </div>
}

export function App(props) {
  var errorHandler = useErrorHandler();

  return <ErrorBoundary>
    <ScopeErrors chainErrorHandler={errorHandler}>
      <ContrastVisor {...props} />
    </ScopeErrors>
  </ErrorBoundary>
}