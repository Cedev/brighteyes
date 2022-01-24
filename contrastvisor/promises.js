
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