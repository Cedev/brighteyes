import React, { useCallback, useContext, useMemo, useState } from "react";


export const consoleErrorHandler = {
  onError: console.error
}


export class ErrorHandler {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
  }

  onError(...args) {
    this.errorHandler.onError(...args);
  }

  wrapPromise(promise) {
    return promise.catch(reason => {
      if (reason instanceof Error) {
        this.errorHandler.onError(reason)
      } else {
        try {
          throw new Error("Promise rejected with reason " + reason?.toString());
        } catch (error) {
          this.errorHandler.onError(error);
        }
      }
      return Promise.reject(reason);
    });
  }

  wrap(f) {
    return (...args) => {
      try {
        return f(...args);
      } catch (error) {
        this.errorHandler.onError(error);
        throw error;
      }
    }
  }
}


export const ErrorHandlerContext = React.createContext(new ErrorHandler(consoleErrorHandler));

export const useErrorHandler = () => useContext(ErrorHandlerContext);

export const ErrorLogContext = React.createContext([]);


export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.errorInfo) {
      return <ErrorDisplay error={this.state.error} details={this.state.errorInfo.componentStack} />
    }
    return this.props.children;
  }
}


// Provide a context to log errors to and a context to recover the logged errors
export function ScopeErrors({ children, chainErrorHandler }) {

  const [errors, setErrors] = useState([]);

  const errorHandler = useMemo(() =>
    new ErrorHandler({
      onError: error => {
        setErrors(errors => [...errors, error])
        if (chainErrorHandler) {
          chainErrorHandler.onError(error);
        }
      }
    }), [chainErrorHandler]);

  return <ErrorLogContext.Provider value={errors}>
    <ErrorHandlerContext.Provider value={errorHandler}>
      {children}
    </ErrorHandlerContext.Provider>
  </ErrorLogContext.Provider>
}


// Overlays error over the current `position`ed element, not necessarily over the children
export function OverlayErrorLog({ children, chainErrorHandler }) {

  const [showErrors, setShowErrors] = useState();

  const errorOverlay = useCallback(errors => {
    if (errors?.length) {
      if (showErrors) {
        return <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, background: 'white'}}>
          <ErrorLog errors={errors} />
          <button onClick={() => setShowErrors(false)}>X</button>
        </div>
      } else {
        return <button style={{ position: 'absolute', bottom: 0, right: 0 }} onClick={() => setShowErrors(true)}>Errors!</button>
      }
    }
  }, [showErrors])


  return <ScopeErrors chainErrorHandler={chainErrorHandler}>
    {children}
    <ErrorLogContext.Consumer>
      {errorOverlay}
    </ErrorLogContext.Consumer>
  </ScopeErrors>
}


export function ErrorLog({ errors }) {
  return <div className="errorLog">
    {errors.map(error => <ErrorDisplay error={error} key={error} />)}
  </div>
}


export function ErrorDisplay({ error, details }) {
  if (error?.stack || details ) {
    return <details className="errorLogEntry">
      <summary>{error?.toString()}</summary>
      {error?.stack &&
        <div className="stackTrace">{error?.stack}</div>
      }
      {details &&
        <div className="details">{details}</div>
      }
    </details>
  }
  return <div className="errorLogEntry">{error?.toString()}</div>
}