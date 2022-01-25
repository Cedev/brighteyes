const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const webpack = require('webpack');
const package = require('./package.json');

module.exports = {
  mode: 'development',
  entry: '/contrastvisor/index.js',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build/contrastvisor'),
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
     title: 'Progressive Web Application',
     template: 'contrastvisor/index.html'
    }),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      swDest: 'sw.js',
      clientsClaim: true,
      skipWaiting: true,
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(package.version)
    })
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
      },
      {
        test: /\.png$/,
        type: 'asset/resource',
        generator: {
          filename: pathData => path.relative('contrastvisor/', pathData.filename)
        }
      },
      {
        test: /\.webmanifest$/,
        type: 'asset/resource',
        generator: {
          filename: pathData => path.relative('contrastvisor/', pathData.filename)
        }
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
