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

    function positionIn(element, event) {        
        var elementPositionOnScreen = getCoords(element);
        var unit = Math.max(elementPositionOnScreen.height, elementPositionOnScreen.width)

        return {
            x: (event.center.x - (elementPositionOnScreen.x + elementPositionOnScreen.width/2)) / unit,
            y: (event.center.y - (elementPositionOnScreen.y + elementPositionOnScreen.height/2)) / unit
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

        var scale = e.scale * startProjection.scale;

        projection = {
            x: pos.x / scale - focus.x,
            y: pos.y / scale - focus.y,
            scale: scale
        }

        callback(projection);
    });
}