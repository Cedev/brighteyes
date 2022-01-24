# Contrast Visor

![A varigated plant viewed in decorrelation stretch](imgs/4plantsacross.png "4 camera modes")

Spot details through your camera using principal components analysis and decorrelation stretch.

[Online version](https://cedev.github.io/contrastvisor/)

There are 4 modes, which are switched between by swiping across the short side of the screen:

 - decorrelation stretch 
 - camera (no processing)
 - camera negative
 - decorrelation stretch of the negative

Double tapping the screen takes a picture.

Swiping across the long side of the screen opens/closes settings.

## Math 

All of the decorrelation modes use the input means and input variance as the target mean and variance for the output image, and are stetched using the covariance matrix. Stretching using the correlation matrix is implemented but not used.

The covariance matrix and means are calculated from a sample of 1000 random pixels in each frame.

## Development

Install [npm](https://www.npmjs.com/get-npm)

Run `npm install` in the root directory to install all dependencies.

### Web

Run `npm run watch` to build and update the javascript bundle.

Open `index.html` in a browser.

Run `npm run watch` to build and update the javascript bundle.
