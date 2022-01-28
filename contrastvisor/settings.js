import React, { Children } from "react";
import Select from '@cedricshock/react-select';
import Toggle from 'react-toggle'
import "react-toggle/style.css"
import { useLenses, useLens } from "./hooks";

export const jpg = { value: "image/jpeg", label: "JPEG", extension: '.jpg' }
export const png = { value: "image/png", label: "PNG", extension: '.png' }

export function ImageFormat({ value, onChange }) {
  return <Select
    className="reactSelect"
    isSearchable={false}
    value={value}
    options={[jpg, png]}
    onChange={onChange}
  />
}

export function ToggleSetting({children, value, onChange}) { 
  return <label className="inline">
    {children}
    <Toggle
      checked={!!value}
      onChange={e => onChange(e.target.checked)} />
    </label>
}


export function DebugSettings({ value, onChange }) {

  const lenses = useLenses();

  const [showCamera, setShowCamera] = useLens(lenses.displayCamera, value, onChange);

  return <details className="debugSettings fieldSetLike">
    <summary>Debug settings:</summary>
    <div>
      <ToggleSetting value={showCamera} onChange={setShowCamera}>Show camera:</ToggleSetting>
    </div>
  </details>
}
