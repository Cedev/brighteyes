import { useCallback, useMemo, useState } from "react";
import { useErrorHandler } from "./errors";
import { LensProxy, over, get } from "./lens";
import { functionOrConstant } from "./prelude";


export function useSignal() {

  const [state, setState] = useState();

  const setSignal = useCallback(signal => {
    setState({ set: true, signal: signal });
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


function readLocalStorage(key, initial, errorHandler) {
  try {
    var stored = window.localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    errorHandler.onError(error);
  }
  return functionOrConstant(initial)();
}

function writeLocalStorage(key, value, errorHandler) {
  try {
    var serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
  } catch (error) {
    errorHandler.onError(error);
  }
}

export function useLocalStorageState(key, initial) {

  const errorHandler = useErrorHandler();

  const [state, setState] = useState(() => readLocalStorage(key, initial, errorHandler));

  const saveState = useCallback(f => {
    setState(oldState => {
      const newState = functionOrConstant(f)(oldState);
      writeLocalStorage(key, newState, errorHandler);
      return newState;
    })
  }, [errorHandler]);

  return [state, saveState];
}


export function useLenses() {
  return useMemo(LensProxy);
}

export function useLens(lens, valueS, setS) {

  const setA = useCallback(fa => setS(over(functionOrConstant(fa))(lens)), [lens, setS]);
  const valueA = get(lens)(valueS);

  return [valueA, setA];
}