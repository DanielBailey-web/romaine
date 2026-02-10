import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

const external = ["react", "react-dom"];
const globals = {
  react: "React",
  "react-dom": "ReactDOM",
};
const NODE_ENV = process.env.NODE_ENV || "development";
export default [
  {
    input: "src/index.tsx",
    output: {
      esModule: false,
      name: "romaine",
      file: "dist/index.jsx",
      format: "esm",
      sourcemap: true,
      globals,
      exports: "named",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json" }),
      replace({
        "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
        preventAssignment: false,
      }),
      peerDepsExternal(),
    ],
    external,
  },
];
