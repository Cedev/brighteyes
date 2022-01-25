import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { useErrorHandler } from './errors';
import { id, toDictionary } from './prelude';

export const defaultVideoConstraints = {
  width: { ideal: 4096, max: 4096 },
  height: { ideal: 4096, max: 4096 }
};

export function CameraConstraints({ constraints, onChange }) {

  function changeCamera(deviceId) {
    if (deviceId) {
      onChange(constraints => ({ ...constraints, deviceId: { exact: deviceId } }));
    } else {
      onChange(constraints => {
        var { deviceId, ...c } = constraints;
        return c
      });
    }
  }

  return <label>
    Camera:
    <CameraSelector value={constraints?.deviceId?.exact} onChange={changeCamera} />
  </label>;
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