const webpack = require('webpack');
const uri:string = "http://localhost:6969";

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      $ENV: {
        DATABASE_URI: uri //JSON.stringify(process.env.DATABASE_URI),
      }
    })
  ]
};

console.log(process.env.DATABASE_URI);
