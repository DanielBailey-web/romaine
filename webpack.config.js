module.exports = {
  target: "node",
  context: __dirname,
  node: {
    __filename: true,
    __dirname: true,
  },
  devtool: "source-map",
  entry: "./src/romaine.development.tsx",
  output: {
    filename: "romaine.development.jsx",
    libraryTarget: "umd",
  },
  devServer: {
    compress: false,
    writeToDisk: true,
  },
  // externals: ["react", "react-dom", "object-assign"],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    symlinks: false,
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.ts$|\.tsx$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            allowTsInNodeModules: true,
          },
        },
      },
      {
        test: /\.js$|\.jsx$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
