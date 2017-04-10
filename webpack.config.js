const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
let env = process.env.NODE_ENV || 'dev';
let configPath = path.resolve(__dirname, "config", "config." + env + ".js");
let config = require(configPath);
let COPYRIGHT = fs.readFileSync(path.resolve(__dirname, "COPYRIGHT")).toString();

let plugins = [
	new webpack.ProvidePlugin({
		$: "jquery",
		jQuery: "jquery",
		Peer: "peerjs/lib/peer",
		util: "peerjs/lib/util",
		angular: "angular"
	}),
	new webpack.DefinePlugin({
		APP_ENV: JSON.stringify(env),
		APP_CONFIG: JSON.stringify(config),
		'process.env': {
			'NODE_ENV': JSON.stringify(env)
		}
	}),
	new ExtractTextPlugin({
		filename: 'theme.css'
	}),
];

if (env !== 'dev') {
	plugins = plugins.concat([
		new webpack.BannerPlugin(COPYRIGHT)
	]);
}

module.exports = {
	entry: {
		app: require.resolve(__dirname + "/src/js/app.js")
	},
	output: {
		path: path.resolve(__dirname, "public/app"),
		filename: "[name].bundle.js"
	},
	resolve: {
		modules: [
			"node_modules",
			path.resolve(__dirname, "src")
		],
		alias: {
			jquery$: require.resolve("jquery/src/jquery")
		},
		extensions: [".js", ".css", ".less"],
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				loader: 'babel-loader',
				options: {
					presets: ['es2015']
				}
			},
			{
				test: /\.less$/,
				use: ExtractTextPlugin.extract([
					{loader: "css-loader"},
					{loader: "less-loader"}
				])
			},
			{
				test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
				loader: 'url-loader',
				options: {
					limit: 10000
				}
			}
		]
	},
	devtool: env === 'dev' ? "eval" : false,
	plugins: plugins
};