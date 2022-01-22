import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { toDictionary } from './prelude';


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
      var {position, ...noPosition} = provided;
      return noPosition;
    }
  }

  const [knownOptions, learnOptions] = useState({});

  const loadOptions = (inputString) => {
    var options = navigator.mediaDevices.enumerateDevices().then(
      devices => devices.filter(x => x.kind == 'videoinput').map(x => ({ value: x.deviceId, label: x.label || x.deviceId })
      )).catch(console.error);

    options.then(options => learnOptions(toDictionary(options, o => o.value)));

    return options;
  };

  return <AsyncSelect
    isSearchable={false}
    isClearable
    loadOptions={loadOptions}
    defaultOptions
    value={{ value: value, label: value ? knownOptions[value]?.label : "Any" }}
    onChange={newValue => onChange(newValue?.value)}
    styles={customStyles}
  />
}