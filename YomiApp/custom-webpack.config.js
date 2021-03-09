const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      $ENV: {
        DATABASE_URI: JSON.stringify(process.env.DATABASE_URI),
      }
    })
  ]
};