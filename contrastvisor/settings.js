import React from "react";
import Select from 'react-select';

export const jpg = { value: "image/jpg", label: "JPEG", extension: '.jpg' }
export const png = { value: "image/png", label: "PNG", extension: '.png' }

export function ImageFormat({ value, onChange }) {
  return <Select
    value={value}
    options={[jpg, png]}
    onChange={onChange}
  />
}