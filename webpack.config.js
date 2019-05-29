const CopyWebpackPlugin = require("copy-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const config = require("sapper/config/webpack.js")
const webpack = require("webpack")

const pkg = require("./package.json")

// const clientEntry = config.client.entry()
// clientEntry.main = ["@babel/polyfill", clientEntry.main]
// const serverEntry = config.server.entry()
// serverEntry.server = ["@babel/polyfill", serverEntry.server]

const mode = process.env.NODE_ENV || "production"
const dev = mode === "development"

const extensions = [".mjs", ".js", ".json", ".svelte", ".html"]
const mainFields = ["svelte", "module", "browser", "main"]

module.exports = {
  client: {
    entry: config.client.entry(),
    output: config.client.output(),
    resolve: { extensions, mainFields },
    module: {
      rules: [
        {
          test: /\.(html|svelte)$/,
          use: [
            "babel-loader",
            {
              loader: "svelte-loader",
              options: {
                dev,
                hydratable: true,
                hotReload: false, // pending https://github.com/sveltejs/svelte/issues/2377
              },
            },
            // {
            //   loader: "eslint-loader",
            //   options: {
            //     emitWarning: dev,
            //     fix: true,
            //   },
            // },
          ],
        },
      ],
    },
    mode,
    plugins: [
      // pending https://github.com/sveltejs/svelte/issues/2377
      // dev && new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
    ].filter(Boolean),
    devtool: dev && "inline-source-map",
  },

  server: {
    entry: config.server.entry(),
    output: config.server.output(),
    target: "node",
    resolve: { extensions, mainFields },
    externals: Object.keys(pkg.dependencies).concat("encoding"),
    module: {
      rules: [
        {
          test: /\.(css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              // Translate CSS into CommonJS modules.
              loader: "css-loader",
              options: {
                importLoaders: 1, // Number of loaders applied before CSS loader
              },
            },
            {
              loader: "postcss-loader", // Run post css actions
              options: {
                plugins: function() {
                  // post css plugins, can be exported to postcss.config.js
                  return [
                    require("postcss-import"),
                    require("tailwindcss"),
                    require("postcss-preset-env")({ stage: 1 }),
                  ]
                },
              },
            },
          ],
        },
        {
          test: /\.(html|svelte)$/,
          use: [
            {
              loader: "svelte-loader",
              options: {
                css: false,
                dev,
                generate: "ssr",
              },
            },
            {
              loader: "eslint-loader",
              options: {
                emitWarning: dev,
                fix: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin([
        {
          from: "node_modules/@fortawesome/",
          to: "../../../static/@fortawesome/",
        },
      ]),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "../../../static/[name].css",
        chunkFilename: "[id].css",
      }),
    ],
    mode,
    performance: {
      hints: false, // it doesn't matter if server.js is large
    },
  },

  serviceworker: {
    entry: config.serviceworker.entry(),
    output: config.serviceworker.output(),
    mode,
  },
}
