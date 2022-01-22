import { useCallback, useState } from "react";


export function useSignal() {

  const [state, setState] = useState();

  const setSignal = useCallback(signal => {
    setState({set: true, signal: signal});
  });

  const takeSignal = useCallback(() => {
    if (state?.set) {
      // Clear the signal
      state.set = false;
      const signal = state.signal;
      state.signal = null;
      return signal;
    }
  }, [state]);

  return [takeSignal, setSignal];
}

function apIfFunction(f, ...args) {
  if (f instanceof Function) {
    return f(...args);
  }
  return f
}

function readLocalStorage(key, initial) {
  try {
    var stored = window.localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(error);
  }
  return apIfFunction(initial);
}

function writeLocalStorage(key, value) {
  try {
    var serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(error);
  }
}

export function useLocalStorageState(key, initial) {

  const [state, setState] = useState(() => readLocalStorage(key, initial));

  const saveState = useCallback(f => {
    setState(oldState => {
      const newState = apIfFunction(f, oldState);
      writeLocalStorage(key, newState);
      return newState;
    })
  }, []);

  return [state, saveState];
}