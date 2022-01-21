import { clamp } from "./prelude";

function getCoords(elem) { // crossbrowser version
  var box = elem.getBoundingClientRect();

  var body = document.body;
  var docEl = document.documentElement;

  var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
  var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

  var clientTop = docEl.clientTop || body.clientTop || 0;
  var clientLeft = docEl.clientLeft || body.clientLeft || 0;

  var top = box.top + scrollTop - clientTop;
  var left = box.left + scrollLeft - clientLeft;

  return { x: Math.round(left), y: Math.round(top), width: box.width, height: box.height };
}

function positionIn(element, event) {
  var elementPositionOnScreen = getCoords(element);
  var unit = Math.max(elementPositionOnScreen.height, elementPositionOnScreen.width)

  return {
    x: (event.center.x - (elementPositionOnScreen.x + elementPositionOnScreen.width / 2)) / unit,
    y: (event.center.y - (elementPositionOnScreen.y + elementPositionOnScreen.height / 2)) / unit
  }
}

const aspectRatioInscribed = ar => {
  if (ar > 1) {
    return {
      width: 1,
      height: 1 / ar
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
  var max = img / 2 - scr / 2
  return clamp(-max, pos, max);
}

function apply(a, { x, y }) {
  return {
    x: x * a.scale + a.x,
    y: y * a.scale + a.y
  }
}

function inverse({ x, y, scale }) {
  /*
    1/s     -x/s     s   x
        1/s -y/s  *    s y
              1          1
  */
  return {
    x: -x / scale,
    y: -y / scale,
    scale: 1 / scale
  }
}

function compose(b, a) {
  /*
    scale2          x2         scale1          x1
            scale2  y2    *            scale1  y1
                    1                          1
  */
  return {
    x: b.scale * a.x + b.x,
    y: b.scale * a.y + b.y,
    scale: b.scale * a.scale
  }
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
    const elementPositionOnScreen = getCoords(element);
    const screenAr = elementPositionOnScreen.width/elementPositionOnScreen.height;

    const { width: scrW, height: scrH } = aspectRatioInscribed(screenAr);
    const { width: imgW, height: imgH } = aspectRatioInscribed(ar);

    const minScaleFactor = Math.min(scrW / imgW, scrH / imgH);
    const minScaleProj = { x: 0, y: 0, scale: minScaleFactor };
    const scale = newProj.scale * minScaleFactor;

    // Clamp the center position so there's no unnecessary gaps
    const x = clampTo(scrW, imgW * scale, newProj.x);
    const y = clampTo(scrH, imgH * scale, newProj.y);

    // Record the projection as-used for the display
    projection = {
      x: x,
      y: y,
      scale: newProj.scale
    }

    const imgToScr = compose(projection, minScaleProj);
    const scrToImg = inverse(imgToScr);

    // Project the screen into the image
    const topLeft = apply(scrToImg, { x: -scrW / 2, y: -scrH / 2 });
    const bottomRight = apply(scrToImg, { x: scrW / 2, y: scrH / 2 });
    const bounds = {
      left: Math.max(-imgW / 2, topLeft.x),
      right: Math.min(imgW / 2, bottomRight.x),
      top: Math.max(-imgH / 2, topLeft.y),
      bottom: Math.min(imgH / 2, bottomRight.y)
    }

    return {
      toScreen: imgToScr,
      screenBoundsInImage: bounds,
      imageWidth: imgW,
      imageHeight: imgH
    }
  }

  hammer.on('pinchstart', function (e) {
    // Get the position of the start of the pinch in screen coordinates
    const pos = positionIn(element, e);

    // Inverse project the point into the image
    focus = apply(inverse(projection), pos);

    startProjection = projection;
  });

  hammer.on('pinch', function (e) {
    const pos = positionIn(element, e);

    const scale = Math.max(e.scale * startProjection.scale, 1);

    const newProj = {
      x: pos.x - focus.x * scale,
      y: pos.y - focus.y * scale,
      scale: scale
    }

    callback(ar => use(newProj, ar));
  });

  callback(ar => use(projection, ar));
}