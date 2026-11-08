const path = require("path");
const { existsSync } = require("fs");
const { loadEnvFile } = require("process");
const { DefinePlugin } = require("webpack");
const ESLintPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const envPath = path.resolve(__dirname, ".env");
if (existsSync(envPath)) loadEnvFile(envPath);

module.exports = (_, argv) => {
  const mode = argv.mode ?? "development";
  const isProduction = mode === "production";

  return {
    mode,
    entry: path.resolve(__dirname, "src/index.jsx"),
    output: {
      path: path.resolve(__dirname, "build"),
      filename: isProduction ? "static/js/[name].[contenthash:8].js" : "static/js/[name].js",
      clean: true,
      publicPath: "/",
    },
    devtool: isProduction ? "source-map" : "eval-cheap-module-source-map",
    devServer: {
      static: { directory: path.resolve(__dirname, "public") },
      compress: true,
      historyApiFallback: true,
      hot: true,
      host: process.env.HOST || "localhost",
      port: Number.parseInt(process.env.PORT ?? "3001", 10),
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        "@components": path.resolve(__dirname, "src/components"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@pages": path.resolve(__dirname, "src/pages"),
        "@services": path.resolve(__dirname, "src/services"),
        "@utils": path.resolve(__dirname, "src/utils"),
      },
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          type: "javascript/auto",
          use: "babel-loader",
        },
        { test: /\.css$/i, use: ["style-loader", "css-loader"] },
      ],
    },
    plugins: [
      new DefinePlugin({
        "process.env.WEBPACK_API_URL": JSON.stringify(process.env.WEBPACK_API_URL ?? ""),
      }),
      new ESLintPlugin({
        context: path.resolve(__dirname, "src"),
        extensions: ["js", "jsx"],
        emitError: true,
        failOnError: isProduction,
      }),
      new HtmlWebpackPlugin({ template: path.resolve(__dirname, "public/index.html") }),
    ],
    optimization: {
      runtimeChunk: "single",
      splitChunks: { chunks: "all" },
    },
  };
};
