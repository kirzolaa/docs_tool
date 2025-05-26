const path = require('path');

module.exports = {
  mode: 'development', // Can be 'production' for optimized builds
  entry: './src/index.js', // We'll create this entry point file
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory for bundled file
    filename: 'bundle.js', // Name of the bundled file
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: function(modulePath) {
          return (
            /node_modules/.test(modulePath) &&
            !/node_modules\/react-native-markdown-display/.test(modulePath)
          );
        },
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    // Aliasing react-native to react-native-web
    alias: {
      'react-native$': 'react-native-web',
    },
    // Attempt to resolve these extensions in order.
    extensions: ['.web.js', '.js', '.jsx'],
    fallback: {
      "punycode": require.resolve("punycode/")
    },
  },
  devtool: 'source-map', // For easier debugging
};
