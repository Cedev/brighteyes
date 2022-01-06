const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
  entry: '/contrastvisor/index.js',
  output: {
    filename: 'bundle-wp.js',
    path: path.resolve(__dirname, 'contrastvisor/lib'),
  },
  plugins: [
    new HtmlWebpackPlugin({
     title: 'Progressive Web Application',
     template: 'contrastvisor/index.html'
    }),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  }
};
