const path = require('path');
const fs = require('fs')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ImageminPLugin = require('imagemin-webpack-plugin').default;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const devMode = process.env.NODE_ENV === 'development';

const PATH = {
    src: path.join(__dirname, './app'),
    dist: path.join(__dirname, './dist'),
    assets: 'assets/'
}

function enableDevtool(mode) {
    return mode ? 'source-map' : false
}

module.exports = {
    entry: `${PATH.src}/index.js`,
    module: {
        rules: [
            { test: /\.s[ac]ss$/i,
                use: [ MiniCssExtractPlugin.loader, 
                    'css-loader',
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                includePaths: ['node_modules']
                            }
                        }
                    }  
                ]
            },
            // { test: /\.svg$/,
            //     type: 'asset/resource',
            //     generator: {
            //         filename: 'img/[name][ext]'
            //     },
            //     use: 'svgo-loader'
            // },
            // { test: /\.(png|jpg|gif)$/,
            //     type: 'asset/resource',
            //     generator: {
            //         filename: 'img/[name][ext]'
            //     }
            // },
            { test: /\.(woff2|woff|eot|ttf)$/,
                type: 'asset/resource'               
            },
            { test: /\.(js)$/,
                exclude: /(node_modules)/, 
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
        clean: true,
        assetModuleFilename: 'assets/[name][ext]'
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].bundle.css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: `${PATH.src}/${PATH.assets}/img`, to: `${PATH.assets}` }
            ],
        }),
        new ImageminPLugin({
            test: /\.(jpe?g|png|gif|svg)$/i,
            disable: devMode,
            pngquant: {
                quality: '95-100'
            }
        })
    ],
    optimization: {
        minimizer: [ 
            new CssMinimizerPlugin(),
            new UglifyJsPlugin()
        ]
    },
    devServer: {
        proxy: {
            '*': 'http://localhost:3000'
        }
    },
    devtool: enableDevtool(devMode)
}