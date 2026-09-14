// craco.config.js
const path = require("path");
require("dotenv").config();

// CRACO:
// - NODE_ENV=development la `craco start`
// - NODE_ENV=production la `craco build`
const isDevServer = process.env.NODE_ENV !== "production";
const isProduction = process.env.NODE_ENV === "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

function makeDevServerV5Compatible(devServerConfig) {
  const {
    https,
    onAfterSetupMiddleware,
    onBeforeSetupMiddleware,
    onListening,
    setupMiddlewares,
    ...compatibleConfig
  } = devServerConfig;

  compatibleConfig.server =
    typeof https === "object"
      ? { type: "https", options: https }
      : https
        ? "https"
        : "http";

  compatibleConfig.headers = {
    ...compatibleConfig.headers,
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (
    onBeforeSetupMiddleware ||
    onAfterSetupMiddleware ||
    setupMiddlewares
  ) {
    compatibleConfig.setupMiddlewares = (middlewares, devServer) => {
      if (onBeforeSetupMiddleware) {
        onBeforeSetupMiddleware(devServer);
      }

      if (setupMiddlewares) {
        middlewares = setupMiddlewares(
          middlewares,
          devServer
        );
      }

      if (onAfterSetupMiddleware) {
        onAfterSetupMiddleware(devServer);
      }

      return middlewares;
    };
  }

  compatibleConfig.onListening = (devServer) => {
    devServer.close ??= (callback) =>
      devServer.stopCallback(callback);

    if (onListening) {
      onListening(devServer);
    }
  };

  return compatibleConfig;
}

/*
 * Health Check
 */
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require(
    "./plugins/health-check/webpack-health-plugin"
  );

  setupHealthEndpoints = require(
    "./plugins/health-check/health-endpoints"
  );

  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],

      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },

  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },

    configure: (webpackConfig) => {
      /*
       * Reduce directoarele urmărite în development.
       */
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,

        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/build/**",
          "**/dist/**",
          "**/coverage/**",
          "**/public/**",
        ],
      };

      /*
       * ============================================================
       * PRODUCTION BUNDLE OPTIMIZATION
       * ============================================================
       *
       * React.lazy() separă deja paginile în chunk-uri.
       *
       * Aici separăm bibliotecile mari/stabile, astfel încât:
       *
       * - React să fie cache-uit separat
       * - React Router separat
       * - Radix separat
       * - Recharts separat
       * - Framer Motion separat
       * - restul npm într-un vendor chunk
       *
       * La actualizarea unei singure pagini nu mai trebuie
       * redescărcat întregul JS al aplicației.
       */
      if (isProduction) {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,

          runtimeChunk: {
            name: "runtime",
          },

          splitChunks: {
            chunks: "all",

            minSize: 20000,

            maxInitialRequests: 25,

            maxAsyncRequests: 30,

            cacheGroups: {
              /*
               * Dezactivăm group-ul implicit Webpack pentru a avea
               * control asupra chunk-urilor de mai jos.
               */
              default: false,

              defaultVendors: false,

              /*
               * React + React DOM
               */
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,

                name: "vendor-react",

                chunks: "all",

                priority: 50,

                enforce: true,
              },

              /*
               * React Router
               */
              router: {
                test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,

                name: "vendor-router",

                chunks: "all",

                priority: 45,

                enforce: true,
              },

              /*
               * Radix UI
               */
              radix: {
                test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,

                name: "vendor-radix",

                chunks: "all",

                priority: 40,

                enforce: true,
              },

              /*
               * Charts
               */
              charts: {
                test: /[\\/]node_modules[\\/](recharts|d3-array|d3-color|d3-format|d3-interpolate|d3-path|d3-scale|d3-shape|d3-time|d3-time-format|victory-vendor)[\\/]/,

                name: "vendor-charts",

                chunks: "all",

                priority: 35,

                enforce: true,
              },

              /*
               * Animation
               */
              motion: {
                test: /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,

                name: "vendor-motion",

                chunks: "all",

                priority: 30,

                enforce: true,
              },

              /*
               * Forms + validation
               */
              forms: {
                test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,

                name: "vendor-forms",

                chunks: "all",

                priority: 25,
              },

              /*
               * Date libraries
               */
              dates: {
                test: /[\\/]node_modules[\\/](date-fns|dayjs|react-day-picker)[\\/]/,

                name: "vendor-dates",

                chunks: "all",

                priority: 20,
              },

              /*
               * Restul modulelor npm
               */
              vendor: {
                test: /[\\/]node_modules[\\/]/,

                name: "vendor",

                chunks: "all",

                priority: 10,

                reuseExistingChunk: true,
              },

              /*
               * Cod comun ART JUNKIE OS.
               *
               * Dacă două sau mai multe pagini folosesc aceeași
               * bucată de cod, Webpack o poate extrage separat.
               */
              common: {
                name: "common",

                minChunks: 2,

                chunks: "all",

                priority: 5,

                reuseExistingChunk: true,
              },
            },
          },
        };
      }

      /*
       * Health Check plugin
       */
      if (
        config.enableHealthCheck &&
        healthPluginInstance
      ) {
        webpackConfig.plugins.push(
          healthPluginInstance
        );
      }

      return webpackConfig;
    },
  },
};

/*
 * Development Server
 */
webpackConfig.devServer = (devServerConfig) => {
  if (
    config.enableHealthCheck &&
    setupHealthEndpoints &&
    healthPluginInstance
  ) {
    const originalSetupMiddlewares =
      devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (
      middlewares,
      devServer
    ) => {
      if (originalSetupMiddlewares) {
        middlewares =
          originalSetupMiddlewares(
            middlewares,
            devServer
          );
      }

      setupHealthEndpoints(
        devServer,
        healthPluginInstance
      );

      return middlewares;
    };
  }

  return devServerConfig;
};

/*
 * Emergent Visual Edits
 *
 * Este încărcat numai în development.
 * Nu intră în bundle-ul de producție.
 */
if (isDevServer) {
  try {
    const {
      withVisualEdits,
    } = require(
      "@emergentbase/visual-edits/craco"
    );

    webpackConfig =
      withVisualEdits(webpackConfig);
  } catch (err) {
    if (
      err.code === "MODULE_NOT_FOUND" &&
      err.message.includes(
        "@emergentbase/visual-edits/craco"
      )
    ) {
      console.warn(
        "[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled."
      );
    } else {
      throw err;
    }
  }
}

/*
 * Webpack Dev Server 5 compatibility
 */
const configureDevServer =
  webpackConfig.devServer;

webpackConfig.devServer = (
  devServerConfig
) =>
  makeDevServerV5Compatible(
    configureDevServer(devServerConfig)
  );

module.exports = webpackConfig;
