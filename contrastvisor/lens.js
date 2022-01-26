import { id, compose } from "./prelude";

export const Id = {
  map: id,
  pure: id,
  ap: id
}

export const Const = {
  map: f => id
}

// A lens is (d f -> a -> f b) -> d f -> s -> f t

// const set = v => over(x => v)
export const set = v => lens => lens(d => x => v)(Id)
export const get = lens => lens(d => id)(Const)
export const over = f => lens => lens(d => f)(Id)

export const propLens = prop => f => d => s => d.map(n => ({ ...s, [prop]: n }))(f(d)(s?.[prop]))

export const LensProxy = (...lenses) => new Proxy(compose(...lenses), lensHandler(lenses))

const lensHandler = lenses => {
  const cachedProps = {};
  return {
    get: (target, prop, receiver) => {
      if (cachedProps[prop]) {
        return cachedProps[prop]
      }
      const lens = LensProxy(...lenses, propLens(prop));
      cachedProps[prop] = lens;
      return lens;
    }
  }
};
