console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV === "production") {
  module.exports = require("./dist");
} else {
  throw new Error("Development mode is not supported.");
  module.exports = require("./src");
}
