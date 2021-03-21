// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const cwd = process.cwd();

const distDirectory = path.resolve(cwd, 'dist');
const srcDirectory = path.resolve(cwd, 'src');
const tsConfigFilePath = path.resolve(cwd, 'tsconfig.build.json');
const entryFile = 'index.ts';
const entry = path.resolve(srcDirectory, entryFile);

module.exports = ({ isProduction }) => ({
  entry,
  mode: isProduction ? 'production' : 'development',
  target: 'async-node',
  devtool: isProduction ? 'source-map' : 'inline-source-map',
  stats: 'minimal',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: distDirectory,
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: tsConfigFilePath,
            },
          },
        ],
      },
    ],
  },
});
