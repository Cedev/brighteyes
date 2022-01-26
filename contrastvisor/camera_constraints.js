import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Toggle from 'react-toggle'
import "react-toggle/style.css"
import { useErrorHandler } from './errors';
import { useLenses, useLens } from './hooks';
import { functionOrConstant, id, toDictionary } from './prelude';

const maxResolution = 4096;

export function videoConstraints(settings) {
  var constraints = {
    width: { max: maxResolution },
    height: { max: maxResolution }
  }
  if (settings?.deviceId) {
    constraints.deviceId = { exact: settings.deviceId }
  }
  const byDeviceId = settings?.byDeviceId?.[settings?.deviceId || ""]
  if (byDeviceId?.width) {
    constraints.width = { ...byDeviceId.width, ...constraints.width }
  }
  if (byDeviceId?.height) {
    constraints.height = { ...byDeviceId.height, ...constraints.height }
  }
  return constraints
}

export function CameraSettings({ settings, onChange }) {

  const deviceKey = settings?.deviceId || "";

  const lenses = useLenses();

  const [deviceId, changeDeviceId] = useLens(lenses.deviceId, settings, onChange);
  const [width, changeWidth] = useLens(lenses.byDeviceId[deviceKey].width, settings, onChange);
  const [height, changeHeight] = useLens(lenses.byDeviceId[deviceKey].height, settings, onChange);

  return <>
    <section className="fieldSetLike">
      <h6>Camera:</h6>
      <CameraSelector value={deviceId} onChange={changeDeviceId} />
      <section className="labelLike">
        <h6>Width:</h6>
        <ResolutionSelector value={width} onChange={changeWidth} />
      </section>
      <section className="labelLike">
        <h6>Height:</h6>
        <ResolutionSelector value={height} onChange={changeHeight} />
      </section>
    </section>
  </>;
}

export function CameraSelector({ value, onChange }) {

  const customStyles = {
    menu: (provided) => {
      var { position, ...noPosition } = provided;
      return noPosition;
    }
  }

  const loadOptions = useCallback((inputString) =>
    navigator.mediaDevices.enumerateDevices()
      .then(devices => devices
        .filter(x => x.kind == 'videoinput')
        .map(x => ({ value: x.deviceId, label: x.label || x.deviceId })
        )), []);

  return <AsyncValueSelect
    className="reactSelect"
    aria-label="Video input device"
    isSearchable={false}
    isClearable
    loadOptions={loadOptions}
    value={value}
    defaultLabel={value?.toString() || "Any"}
    onChange={onChange}
    styles={customStyles}
  />
}

function AsyncValueSelect({ loadOptions, ...props }) {

  const errorHandler = useErrorHandler();
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(0);

  const doLoadOptions = useCallback(
    () => {
      setLoading(x => x + 1);
      errorHandler.wrapPromise(errorHandler.wrap(loadOptions)().then(setOptions).finally(() => setLoading(x => x - 1)));
    }
    , [loadOptions, errorHandler]);

  useEffect(doLoadOptions, [loadOptions]);

  return <ValueSelect
    options={options}
    onMenuOpen={doLoadOptions}
    isLoading={loading}
    {...props}
  />
}

function ValueSelect({ value, options, defaultLabel, onChange, ...props }) {

  const optionLookup = useMemo(
    () => toDictionary(options, o => o.value)
    , [options]);

  return <Select
    options={options}
    value={optionLookup[value] || { value: value, label: defaultLabel }}
    {...props}
    onChange={value => onChange(value?.value)}
  />
}

const resolutions = [
  4096, // max
  3840, // 3840*2160
  3072, // 3/4 4096
  2880, // 4:3 2160
  2560, // 16:9 1440 
  2304, // 9/16 4096
  2048, // misc
  2160, // 3840*2160
  1920, // 16:9 HD, 4:3 1440
  1600, // misc
  1440, // lots
  1280, // 4:3 960, 16:9 720
  1200, // misc
  1024, // misc
  1080, // HD,
  960, // "HD"
  720, // "HD"
  800, // SVGA
  640, // VGA
  600, // SVGA 
  480  // VGA
]

function discombobulate(value) {
  return {
    exact: Boolean(value?.exact),
    resolution: value?.exact || value?.ideal
  }
}

function recombobulate(discombobulated) {
  if (discombobulated?.resolution) {
    return discombobulated?.exact ? { exact: discombobulated.resolution } : { ideal: discombobulated.resolution }
  }
}

export function ResolutionSelector({ value: combobulated, onChange: onCombobulatedChange }) {

  const value = discombobulate(combobulated);
  const onChange = useCallback(f => onCombobulatedChange(x => recombobulate(functionOrConstant(f)(discombobulate(x)))), [onCombobulatedChange]);

  const [options, setOptions] = useState(resolutions);

  const lenses = useLenses()
  const [exact, changeExact] = useLens(lenses.exact, value, onChange);
  const [resolution, changeResolution] = useLens(lenses.resolution, value, onChange);

  const isValidResolution = useCallback(inputValue => parseInt(inputValue) > 0 && parseInt(inputValue) <= maxResolution, []);

  const addResolution = useCallback(inputValue => {
    const number = parseInt(inputValue);
    setOptions(resolutions => resolutions.includes(number) ? resolutions : [...resolutions, number].sort((a, b) => b - a));
    changeResolution(number);
  }, [])

  return <div className="resolutionSelector">
    <Toggle
      aria-label="Use exact resolution"
      checked={exact}
      disabled={!resolution}
      icons={{
        checked: <span className='toggleSymbol'>=</span>,
        unchecked: <span className='toggleSymbol'>≈</span>,
      }}
      onChange={e => changeExact(e.target.checked)} />
    <CreatableSelect
      className="resolution reactSelect"
      aria-label="Resolution"
      isClearable
      value={{ value: resolution, label: resolution || "Any" }}
      onChange={value => changeResolution(value?.value)}
      options={options.map(resolution => ({ value: resolution, label: resolution }))}
      isValidNewOption={isValidResolution}
      onCreateOption={addResolution}
    />
  </div>
}