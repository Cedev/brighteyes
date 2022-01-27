import React, { useEffect, useState } from "react";

export function InstallButton({ children }) {

  const [deferredPrompt, setDeferredPrompt] = useState();

  useEffect(() => {
    const abort = new AbortController();

    window.addEventListener('beforeinstallprompt', e => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      setDeferredPrompt(e)
    }, { signal: abort.signal });

    return abort.abort
  }, [])

  if (!deferredPrompt) {
    return null
  }

  return <button onClick={() => {
    deferredPrompt.prompt();
    setDeferredPrompt(null);
  }}>
    {children}
  </button>

}