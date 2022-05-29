const path = require("path");
const glob = require('glob');
const webpack = require("webpack");
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const { VueLoaderPlugin } = require("vue-loader");

const ROOT_PATH = path.resolve(__dirname, '..');
const WEBPACK_OUTPUT_PATH = path.join(ROOT_PATH, 'public/assets/webpack');
const WEBPACK_PUBLIC_PATH = "/assets/webpack";
const FRONTEND_JAVASCRIPTS_PATH = path.join(ROOT_PATH, 'app/assets/javascripts');

const defaultEntries = [
    path.join(FRONTEND_JAVASCRIPTS_PATH, 'application.js')
];

function generateEntries() {
    // generate automatic entry points
    const autoEntries = {};
    const autoEntriesMap = {};
    const pageEntries = glob.sync('pages/**/index.js', {
      cwd: path.join(ROOT_PATH, 'app/assets/javascripts'),
    });

    function generateAutoEntries(entryPath, prefix = '.') {
      const chunkPath = entryPath.replace(/\/index\.js$/, '');
      const chunkName = chunkPath.replace(/\//g, '.');
      autoEntriesMap[chunkName] = `${prefix}/${entryPath}`;
    }
  
    pageEntries.forEach((entryPath) => generateAutoEntries(entryPath, FRONTEND_JAVASCRIPTS_PATH));
  
    const autoEntryKeys = Object.keys(autoEntriesMap);
  
    // import ancestor entrypoints within their children
    autoEntryKeys.forEach((entry) => {
      const entryPaths = [autoEntriesMap[entry]];
      const segments = entry.split('.');
      while (segments.pop()) {
        const ancestor = segments.join('.');
        if (autoEntryKeys.includes(ancestor)) {
          entryPaths.unshift(autoEntriesMap[ancestor]);
        }
      }
      autoEntries[entry] = defaultEntries.concat(entryPaths);
    });
  
    const manualEntries = {
      default: defaultEntries,
    };
  
    return Object.assign(manualEntries, autoEntries);
  }

const config = (
    module.exports = {
        // the base path which will be used to resolve entry points
        context: __dirname,
    }
);

config.entry = generateEntries;

config.output = {
    path: WEBPACK_OUTPUT_PATH,
    publicPath: WEBPACK_PUBLIC_PATH,
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
    }),
    // enable vue-loader to use existing loader rules for other module types
    new VueLoaderPlugin(),
];

config.module = {
    rules: [
        {
            test: /\.vue$/,
            loader: "vue-loader",
        },
        {
            test: /.css$/,
            use: [
                'vue-style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: 'global',
                        localIdentName: '[name].[contenthash:8].[ext]',
                    },
                },
            ],
        },
    ],
};

