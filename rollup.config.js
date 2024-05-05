import { wasm } from "@rollup/plugin-wasm";
import typescript from "rollup-plugin-typescript";

export default {
  input: "./src/index.ts",
  output: [
    {
      format: "esm",
      file: "./dist/index.esm.js",
      sourcemap: true,
    },
    {
      name: "wa-ulid",
      format: "umd",
      file: "./dist/index.umd.js",
      sourcemap: true,
    },
  ],
  plugins: [
    typescript(),
    wasm({
      sync: ["pkg/wa_ulid_bg.wasm"],
    }),
  ],
};
