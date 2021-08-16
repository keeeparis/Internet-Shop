const { webpack } = require("webpack");
const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const devMode = process.env.NODE_ENV === 'development';
console.log(devMode);
/** BY WEBPACK DOCUMENTATION
 *  in pachage.json -> removed "main": "index.js" 
 *  and set "private": true 
 */

module.exports = {
    entry: './app/index.js',
    module: {
        rules: [
            { 
                test: /\.s[ac]ss$/i,
                use: [ MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader' ]
            },
            {
                test: /\.svg$/,
                type: 'asset/resource',
                generator: {
                    filename: 'img/[name][ext]'
                },
                use: 'svgo-loader'
            },
            {
                test: /\.(png|jpg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'img/[name][ext]'
                }
            },
            {
                test: /\.(woff2|woff|eot|ttf)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext]'
                }                
            },
            { 
                test: /\.(js)$/,
                exclude: /(node_modules|bower_components)/, 
                use: { 
                    loader: 'babel-loader',
                    options: { 
                        presets: ['@babel/preset-env']
                    }
                }
            },
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
        clean: true
        // assetModuleFilename: 'img/[hash][ext]'
    },
    plugins: [
        // в сборке вряд ли буду использовать, так как буду через pug
        // new HtmlWebpackPlugin() // создает html в папке с бандлом и автом. содержит его
        new MiniCssExtractPlugin({
            filename: '[name].bundle.css'
        }),
        // new CleanWebpackPlugin()
        new CopyPlugin({
            patterns: [
              { from: 'app/img/*.png', to: './img/[name].png' }, // копирует все вайлы png в dist папку, чтоб использовать в .pug в server
            ],
        })
    ],
    optimization: {
        minimizer: [ new CssMinimizerPlugin() ],
        // minimize: true
    },
    devServer: {
        open: true,
        hot: true,
        proxy: {
            '*': 'http://localhost:3000'
        }

        // proxy: {
        //     '/api':  {
        //         target: 'http://localhost:3000',
        //         pathRewrite: { '^/api': '' }
        //     }
        // }
    }
}