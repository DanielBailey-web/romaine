import typescript from "rollup-plugin-typescript2";
import del from "rollup-plugin-delete";
import pkg from "./package.json";
import { eslint } from "rollup-plugin-eslint";
import replace from "@rollup/plugin-replace";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json"];
const external = ["react", "react-dom"];
const globals = {
  react: "React",
  "react-dom": "ReactDOM",
};
const NODE_ENV = process.env.NODE_ENV || "development";
export default [
  {
    input: "src/romaine_components.development.tsx",
    output: {
      esModule: false,
      name: "romaine",
      file: pkg.main,
      format: "esm",
      sourcemap: true,
      globals,
      exports: "named",
      // paths: {
      //   react: "../../node_modules/react",
      // },
    },
    plugins: [
      // del({ targets: ["dist/*", "playground/src/component-lib"] }),
      typescript({ tsconfig: "./tsconfig.json" }),
      replace({
        "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
      }),
      peerDepsExternal(),
      eslint(),
    ],
    external,
  },
];
