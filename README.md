# Contrast Visor

![A varigated plant viewed in decorrelation stretch](imgs/4plantsacross.png "4 camera modes")

Spot details through your camera using principal components analysis and decorrelation stretch.

[Online version](https://cedev.github.io/contrastvisor/)

There are 4 modes, which are switched between by swiping the screen in any direction:

 - decorrelation stretch 
 - camera (no processing)
 - camera negative
 - decorrelation stretch of the negative

Tapping the screen takes a picture.

### Android app

To install the android app find the latest release on github and download the `.apk` file from the assets.

Grant the app permission to use the camera before running it, or it won't be able to see anything.

## Math 

All of the decorrelation modes use the input means and input variance as the target mean and variance for the output image, and are stetched using the covariance matrix. Stretching using the correlation matrix is implemented but not used.

The covariance matrix and means are calculated from a sample of 1000 random pixels in each frame.

## Development

Install [npm](https://www.npmjs.com/get-npm)

Run `npm install` in the root directory to install all dependencies.

### Web

Run `npm run watch` to build and update the javascript bundle.

Open `index.html` in a browser.

## Andriod

Install [android studio](https://developer.android.com/studio/index.html).

Run `npm run watch` to build and update the javascript bundle.
