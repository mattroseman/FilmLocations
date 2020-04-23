const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: path.join(__dirname, "client/index.js"),
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        loader: "file-loader"
      }
    ]
  },
  resolve: { extensions: ["*", ".js", ".jsx"] },
  output: {
    path: path.resolve(__dirname, "client/dist/"),
    publicPath: "/",
    filename: "bundle.js"
  },
  devServer: {
    contentBase: path.join(__dirname, "client/public/"),
    port: 3000,
    publicPath: "http://localhost:3000/",
    hotOnly: true,
    disableHostCheck: true
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devtool: 'source-map'
};
