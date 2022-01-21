export const range = x => Array(x).fill().map((_, i) => i);

export const id = x => x

export const toDictionary = (ar, key, value=id) => ar.reduce((d, i) => ({...d, [key(i)]: value(i)}), {});