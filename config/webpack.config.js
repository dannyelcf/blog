const path = require("path");
const webpack = require("webpack");
const { StatsWriterPlugin } = require('webpack-stats-plugin');

const ROOT_PATH = path.resolve(__dirname, '..');

const WEBPACK_OUTPUT_PATH = path.join(ROOT_PATH, 'public/assets/webpack');
const WEBPACK_PUBLIC_PATH = "/assets/webpack";

const FRONTEND_JAVASCRIPTS_PATH = path.join(ROOT_PATH, 'app/assets/javascripts');

const config = (
    module.exports = {
        // the base path which will be used to resolve entry points
        context: __dirname,
    }
);

config.entry = [
    path.join(FRONTEND_JAVASCRIPTS_PATH, 'application.js'),
];

config.output = {
    path: WEBPACK_OUTPUT_PATH,
    publicPath: WEBPACK_PUBLIC_PATH,
    filename: "bundle.js",
    filename: '[name].bundle.js',
    chunkFilename: '[name].chunk.js',
    globalObject: 'this', // allow HMR and web workers to play nice
};

config.resolve = {
    // tell webpack which extensions to auto search when it resolves modules. With this,
    // you'll be able to do `require('./utils')` instead of `require('./utils.js')`
    extensions: [".js"],
};

config.plugins = [
    // manifest filename must match config.webpack.manifest_filename
    // webpack-rails only needs assetsByChunkName to function properly
    new StatsWriterPlugin({
      filename: 'manifest.json',
      transform(data, opts) {
        const stats = opts.compiler.getStats().toJson({
          chunkModules: false,
          source: false,
          chunks: false,
          modules: false,
          assets: true,
          errors: true,
          warnings: true,
        });

        return JSON.stringify(stats, null, 2);
      },
    })
]
