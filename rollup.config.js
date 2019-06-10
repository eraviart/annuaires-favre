import purgeCss from "@fullhuman/postcss-purgecss"
import purgeSvelte from "purgecss-from-svelte"
import babel from "rollup-plugin-babel"
import commonjs from "rollup-plugin-commonjs"
import { eslint } from "rollup-plugin-eslint"
import resolve from "rollup-plugin-node-resolve"
import postcss from "rollup-plugin-postcss"
import replace from "rollup-plugin-replace"
import svelte from "rollup-plugin-svelte"
import { terser } from "rollup-plugin-terser"
import config from "sapper/config/rollup.js"

import pkg from "./package.json"

const mode = process.env.NODE_ENV
const dev = mode === "development"
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) =>
  (warning.code === "CIRCULAR_DEPENDENCY" &&
    warning.message.includes("/@sapper/")) ||
  onwarn(warning)

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      svelte({
        dev,
        emitCss: true,
        hydratable: true,
      }),
      resolve({
        browser: true,
      }),
      commonjs(),

      legacy &&
        babel({
          extensions: [".js", ".mjs", ".html", ".svelte"],
          runtimeHelpers: true,
          exclude: ["node_modules/@babel/**"],
          presets: [
            [
              "@babel/preset-env",
              {
                targets: "> 0.25%, not dead",
              },
            ],
          ],
          plugins: [
            "@babel/plugin-syntax-dynamic-import",
            [
              "@babel/plugin-transform-runtime",
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],

    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        "process.browser": false,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      eslint({
        emitWarning: dev,
        fix: true,
      }),
      svelte({
        dev,
        generate: "ssr",
      }),
      postcss({
        extract: "./static/global.css",
        plugins: [
          require("postcss-import"),
          require("tailwindcss"),
          require("postcss-preset-env")({ stage: 1 }),
          // Don't purge CSS in dev mode to be able to play with classes in the browser dev-tools.
          !dev && false &&
            purgeCss({
              content: ["./src/**/*.svelte"],
              css: ["**/*.css"],
              extractors: [
                {
                  extractor: purgeSvelte,
                  extensions: ["svelte"],
                },
              ],
            }),
        ].filter(Boolean),
      }),
      resolve(),
      commonjs(),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require("module").builtinModules ||
        Object.keys(process.binding("natives")),
    ),

    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      commonjs(),
      !dev && terser(),
    ],

    onwarn,
  },
}
