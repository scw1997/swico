import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { getFormatDefineVars, initConfig, GlobalData } from '../utils/tools';
import WebpackBar from 'webpackbar';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';
import { VueLoaderPlugin } from 'vue-loader';

export default async function ({ projectPath, entryPath, env, customConfig }: GlobalData) {
    //开发者的自定义配置
    const customBaseConfig = customConfig.base || {};
    //处理alias 自定义配置
    const getCustomAliasConfig = () => {
        const { alias } = customBaseConfig;
        const custAliasConfig = {};
        if (alias) {
            Object.keys(alias).forEach((key) => {
                custAliasConfig[key] = path.join(projectPath, `/${alias[key]}`);
            });
        }
        return custAliasConfig;
    };
    const publicPath = customBaseConfig.publicPath || initConfig.publicPath;
    const basicPlugins = [];
    //处理自定义变量设置
    const defineConfigData = customConfig?.base?.define ?? {};
    const formatObj = await getFormatDefineVars(defineConfigData);
    if (Object.keys(formatObj).length !== 0) {
        basicPlugins.push(new webpack.DefinePlugin(formatObj));
    }

    return {
        //入口文件路径，必须为js
        entry: entryPath,
        //打包后文件路径
        output: {
            path: path.join(projectPath, '/dist'),
            filename: 'js/[name].[chunkhash].js',
            // 静态文件打包后的路径及文件名（默认是走全局的，如果有独立的设置就按照自己独立的设置来。）
            assetModuleFilename: 'assets/[name]_[chunkhash][ext]',
            publicPath,
            clean: true
        },
        target: ['web', 'es5'], //webpack5默认生成es6，设置编译打包生成es5代码
        cache: {
            type: 'filesystem' // 使用文件缓存
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [
                        'thread-loader', //多进程打包，建议只用于耗时较长的loader前面
                        {
                            loader: 'babel-loader?cacheDirectory=true',
                            options: {
                                presets: ['@babel/preset-env'],
                                plugins: ['@babel/plugin-transform-runtime']
                            }
                        },
                        {
                            loader: 'ts-loader',
                            options: {
                                //配置了thread-loader必须加这个选项,否则报错
                                //开启此选项会默认忽略ts类型检查校验且编译时不报类型错误，需配合fork-ts-checker-webpack-plugin使用
                                happyPackMode: true
                            }
                        }
                    ]
                },
                {
                    test: /\.vue$/,
                    use: [
                        {
                            loader: 'vue-loader'
                        }
                    ],
                    include: /src/
                },

                {
                    oneOf: [
                        {
                            test: /\.module\.css$/,
                            use: [
                                env === 'dev' ? 'style-loader' : MiniCssExtractPlugin.loader,
                                MiniCssExtractPlugin.loader,
                                {
                                    loader: 'css-loader',
                                    options: {
                                        modules: {
                                            localIdentName: 'moduleStyle_[local]_[contenthash:8]'
                                        }
                                    }
                                },
                                {
                                    loader: 'postcss-loader',
                                    options: {
                                        postcssOptions: {
                                            plugins: [['autoprefixer']]
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            test: /\.css$/,
                            use: [
                                env === 'dev' ? 'style-loader' : MiniCssExtractPlugin.loader,
                                'css-loader',
                                {
                                    loader: 'postcss-loader',
                                    options: {
                                        postcssOptions: {
                                            plugins: [['autoprefixer']]
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            test: /\.module\.less$/,

                            use: [
                                env === 'dev' ? 'style-loader' : MiniCssExtractPlugin.loader,
                                {
                                    loader: 'css-loader',
                                    options: {
                                        modules: {
                                            localIdentName: 'moduleStyle_[local]_[contenthash:8]'
                                        }
                                    }
                                },

                                {
                                    loader: 'postcss-loader',
                                    options: {
                                        postcssOptions: {
                                            plugins: [['autoprefixer']]
                                        }
                                    }
                                },
                                'less-loader'
                            ]
                        },
                        {
                            test: /\.less$/,
                            use: [
                                env === 'dev' ? 'style-loader' : MiniCssExtractPlugin.loader,
                                'css-loader',
                                {
                                    loader: 'postcss-loader',
                                    options: {
                                        postcssOptions: {
                                            plugins: [['autoprefixer']]
                                        }
                                    }
                                },
                                'less-loader'
                            ]
                        },
                        {
                            test: /\.(jpg|png|gif|webp|bmp|jpeg)$/,
                            type: 'asset', //在导出一个 data URI 和发送一个单独的文件之间自动选择
                            generator: {
                                filename: 'images/[name]_[hash][ext]' // 独立的配置
                            }
                        },
                        // 字体文件
                        {
                            test: /\.(otf|eot|woff2?|ttf|svg)$/i,
                            type: 'asset',
                            generator: {
                                filename: 'fonts/[name]_[hash][ext]'
                            }
                        },
                        // 数据文件
                        {
                            test: /\.(txt|xml)$/i,
                            type: 'asset/source'
                        },
                        {
                            test: /\.html$/,
                            loader: 'html-loader'
                        }
                    ]
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js', '.vue'],
            alias: {
                '@': path.join(projectPath, '/src'),
                // 兼容 支持vue运行时Options语法
                vue: 'vue/dist/vue.esm-bundler.js',
                ...getCustomAliasConfig()
            }
        },
        plugins: [
            ...basicPlugins,
            new VueLoaderPlugin(),
            //正在运行 Vue 的 esm-bundler 构建，它希望这些编译时的功能标志通过 bundler 配置全局注入，以便在生产包中获得更好的摇树优化
            new webpack.DefinePlugin({
                __VUE_OPTIONS_API__: true,
                __VUE_PROD_DEVTOOLS__: false,
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
            }),
            new HtmlWebpackPlugin({
                //不使用默认html文件，使用自己定义的html模板并自动引入打包后的js/css
                template: path.join(projectPath, '/src/index.ejs'),
                filename: 'index.html', //打包后的文件名
                minify: {
                    //压缩和简化代码
                    collapseWhitespace: true, //是否去掉空行和空格
                    removeAttributeQuotes: true //是否去掉html标签属性的引号
                },
                templateParameters: {
                    publicPath
                },
                hash: true //对html引用的js文件添加hash戳
            }),
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    diagnosticOptions: {
                        semantic: true,
                        syntactic: true
                    }
                }
            }),
            new MiniCssExtractPlugin({
                filename: env === 'dev' ? 'css/[name].css' : 'css/[name].[contenthash].css',
                ignoreOrder: true
            }),
            // 编译进度条
            new WebpackBar({
                name: 'Secywo',
                color: '#82B2FD',
                profile: true
            }),
            ...(customBaseConfig.plugins || initConfig.plugins)
        ]
    };
}
