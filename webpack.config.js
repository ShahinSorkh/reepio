const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const clc = require('cli-color');

function getEnv() {
	return process.env.NODE_ENV || 'dev';
}

function getCopyright() {
	let licensePath = path.resolve(__dirname, "COPYRIGHT");
	try {
		return fs.readFileSync(licensePath).toString();
	} catch (e) {
		console.error(`no copyright file found at ${licensePath}`);
		process.exit(1);
	}
}

function getConfigurationPathForEnvironment(env) {
	return path.resolve(__dirname, 'config', `config.${env}.js`);
}

function loadConfig() {
	let env = getEnv();
	let envConfiguration = getConfigurationPathForEnvironment(env);
	try {
		return require(envConfiguration);
	} catch (e) {
		let defaultConfiguration = getConfigurationPathForEnvironment('dist');
		console.log(clc.yellow(`No config found for environment ${env}. Loading default configuration at ${defaultConfiguration}`));
		return require(defaultConfiguration);
	}
}

let env = getEnv();
let copyright = getCopyright();

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
		APP_CONFIG: JSON.stringify(loadConfig(env)),
		'process.env': {
			'NODE_ENV': JSON.stringify(env)
		}
	}),
	new ExtractTextPlugin({
		filename: 'theme.css'
	})
];

if (getEnv() !== 'dev') {
	plugins = plugins.concat([
		new webpack.BannerPlugin(copyright)
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