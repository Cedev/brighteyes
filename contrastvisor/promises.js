
// Synchronously use the value of a steam of promises, only if they resolve before all later promises
// Promise to tell when each of them is done being used (has been replaced by a later resolved promise)
export function PromiseSerializer() {

  var clock = 0;
  var current = undefined;
  var currentClock = 0;
  var currentCleanup = () => undefined

  function schedule(promise, use) {
    clock = clock + 1;
    var id = clock;

    return new Promise((resolve, reject) => {
      promise.then(result => {
        if (id > currentClock) {
          // This is the newest result
          var prevCleanup = currentCleanup;
          var prevValue = current;
          current = result;
          currentClock = id;
          currentCleanup = resolve;
          try {
            use(current);
          } catch (error) {
            console.error(error);
          }
          prevCleanup(prevValue);
        } else {
          // A newer result has already arrived
          // this one is done being used without ever being used
          resolve(result);
        }
      }).catch(reject);
    });
  };

  return schedule;
}



// Synchronously use the value of a steam of promise factories, only if they start after all previosly started promises have resolved.
// Promises can return a clean up that will be performed before the next promise is used
export function FastForwardSerializer() {

  var current = Promise.resolve();
  var next = undefined;

  function doNext() {
    var todo = next;
    next = undefined;
    var cleanUp = todo();
    return cleanUp;
  }

  function schedule(promise) {
    var scheduledNext = next;
    next = promise;

    if (!scheduledNext) {
      current = current.then(cleanUp => {
        if (cleanUp) {
          return cleanUp();
        }
      }).then(doNext, doNext);
    }
  }

  return schedule;
}