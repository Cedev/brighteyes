const path = require('path');

module.exports = {
  entry: '/contrastvisor/index.js',
  output: {
    filename: 'bundle-wp.js',
    path: path.resolve(__dirname, 'contrastvisor/lib'),
  },
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
