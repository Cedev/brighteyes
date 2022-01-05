const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
