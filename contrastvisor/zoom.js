import { clamp } from "./prelude";

function getCoords(elem) { // crossbrowser version
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { x: Math.round(left), y: Math.round(top), width: box.width, height: box.height };
}

const aspectRatioInscribed = ar => {
  if (ar > 1) {
    return {
      width: 1,
      height: 1/ar
    }
  } 
  return {
    width: ar,
    height: 1
  }
}

// Clamp a position so that an image translated by it
// doesn't leave an unnecessary gap to the screen
function clampTo(scr, img, pos) {
  if (scr >= img) {
    return 0;
  }
  // Can't get closer than half a screen to the edge of the image
  var max = img/2 - scr/2
  return clamp(-max, pos, max);
}

export function pinchZoom(element, hammer, callback) {

    var projection = {
        x: 0,
        y: 0,
        scale: 1
    }

    // Event state
    // The projection at the start of an event
    var startProjection = undefined;
    // Point in the image to move under fingers and zoom around.
    var focus = undefined;

    function use(newProj, ar) {
      const {width: scrW, height: scrH} = aspectRatioInscribed(newProj.ar);
      const {width: imgW, height: imgH} = aspectRatioInscribed(ar);

      var minScaleFactor = Math.min(scrW/imgW, scrH/imgH);

      // Clamp the center position so there's no unnecessary gaps
      var x = clampTo(scrW/newProj.scale, imgW*minScaleFactor, newProj.x);
      var y = clampTo(scrH/newProj.scale, imgH*minScaleFactor, newProj.y);

      // Record the projection as-used for the display
      projection = {
        x: x,
        y: y,
        scale: newProj.scale
      }

      return {
        x: x/minScaleFactor,
        y: y/minScaleFactor,
        scale: newProj.scale*minScaleFactor
      }
    }

    function positionIn(element, event) {        
        var elementPositionOnScreen = getCoords(element);
        var unit = Math.max(elementPositionOnScreen.height, elementPositionOnScreen.width)

        return {
            x: (event.center.x - (elementPositionOnScreen.x + elementPositionOnScreen.width/2)) / unit,
            y: (event.center.y - (elementPositionOnScreen.y + elementPositionOnScreen.height/2)) / unit,
            ar: elementPositionOnScreen.width/elementPositionOnScreen.height
        }
    }

    hammer.on('pinchstart', function(e) {
        // Get the position of the start of the pinch in screen coordinates
        var pos = positionIn(element, e);
        
        // Inverse project the point into the image
        focus = {
            x: pos.x/projection.scale - projection.x,
            y: pos.y/projection.scale - projection.y
        }

        startProjection = projection;
    });

    hammer.on('pinch', function(e) {
        var pos = positionIn(element, e);

        var scale = Math.max(e.scale * startProjection.scale, 1);

        var newProj = {
            x: pos.x / scale - focus.x,
            y: pos.y / scale - focus.y,
            scale: scale,
            ar: pos.ar
        }

        callback(ar => use(newProj, ar));
    });
}