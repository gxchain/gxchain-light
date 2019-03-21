var path = require("path");
var webpack = require("webpack");
var root_dir = path.resolve(__dirname);

module.exports = {
    entry: {
        electron: path.resolve(root_dir, "resources/index.js")
    },
    output: {
        filename: 'index.js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, './electron')
    },
    node:{
        __dirname: false,
        __filename: false
    },
    resolve: {
        modules: ["node_modules", path.resolve(__dirname, './resources')],
        extensions: ['.js', '.vue', '.json', '.css', '.node']
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ],
    target: 'electron-renderer'
};
