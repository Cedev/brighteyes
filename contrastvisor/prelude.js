export const range = x => Array(x).fill().map((_, i) => i);

export const id = x => x

export const constant = x => () => x

export const toDictionary = (ar, key, value=id) => ar.reduce((d, i) => ({...d, [key(i)]: value(i)}), {});

export const clamp = (a, b, c) => Math.max(a, Math.min(b, c))

export const compose = (...fs) => x => {
  for (var i = fs.length - 1; i >= 0; i--) {
    x = fs[i](x);
  }
  return x;
}

export const functionOrConstant = f => f instanceof Function ? f : constant(f)
