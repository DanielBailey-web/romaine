// export { ...src, ...dist };
// if (process.env.NODE_ENV === "production") {
//   module.exports = require("./dist");
// } else {
//   module.exports = require("./src/romaine.development");
// }
// export do NOT override, so do ./dist first
export * from "./dist";
// @ts-ignore
export * from "./src/romaine.development";
