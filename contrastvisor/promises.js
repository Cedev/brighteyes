
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