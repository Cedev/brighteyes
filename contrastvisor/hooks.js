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