import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { getFormatDefineVars, initConfig, GlobalData } from '../utils/config';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { VueLoaderPlugin } from 'vue-loader';
const vueStyleLoader = require.resolve('vue-style-loader');
const cssLoader = require.resolve('css-loader');
const lessLoader = require.resolve('less-loader');
const sassLoader = require.resolve('sass-loader');
const postcssLoader = require.resolve('postcss-loader');

export default async function ({ projectPath, entryPath, env, customConfig }: GlobalData) {
    //开发者的自定义配置
    const customBaseConfig = customConfig.base;
    //处理alias 自定义配置
    const getCustomAliasConfig = () => {
        const { alias } = customBaseConfig || {};
        const custAliasConfig = {};
        if (alias) {
            Object.keys(alias).forEach((key) => {
                custAliasConfig[key] = path.join(projectPath, `/${alias[key]}`);
            });
        }
        return custAliasConfig;
    };
    const publicPath = customBaseConfig?.publicPath || initConfig.publicPath;
    const routerBase = customBaseConfig?.router?.base || initConfig.router.base;
    const basicPlugins = [];
    //处理自定义变量设置
    const defineConfigData = customConfig?.base?.define ?? {};
    const formatObj = await getFormatDefineVars(defineConfigData);
    if (Object.keys(formatObj).length !== 0) {
        basicPlugins.push(new webpack.DefinePlugin(formatObj));
    }

    return {
        //入口文件路径
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
                    test: /\.vue$/,
                    loader: require.resolve('vue-loader'),
                    exclude: /node_modules/
                },
                {
                    test: /\.(ts|js)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: require.resolve('swc-loader'),
                            options: {
                                jsc: {
                                    parser: {
                                        syntax: 'typescript',
                                        tsx: false,
                                        decorators: true,
                                        dynamicImport: true
                                    },
                                    target: 'es2015'
                                }
                            }
                        }
                    ]
                },

                {
                    oneOf: [
                        {
                            test: /\.css$/,
                            oneOf: [
                                // 这里匹配 `<style module>`
                                {
                                    resourceQuery: /module/,
                                    use: [
                                        vueStyleLoader,
                                        {
                                            loader: cssLoader,
                                            options: {
                                                modules: {
                                                    localIdentName:
                                                        'moduleStyle_[local]_[contenthash:8]'
                                                }
                                            }
                                        },
                                        {
                                            loader: postcssLoader,
                                            options: {
                                                postcssOptions: {
                                                    plugins: [['autoprefixer']]
                                                }
                                            }
                                        }
                                    ]
                                },
                                // 这里匹配普通的 `<style>` 或 `<style scoped>`
                                {
                                    use: [
                                        env === 'dev'
                                            ? vueStyleLoader
                                            : MiniCssExtractPlugin.loader,
                                        cssLoader,
                                        {
                                            loader: postcssLoader,
                                            options: {
                                                postcssOptions: {
                                                    plugins: [['autoprefixer']]
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            test: /\.less$/,

                            oneOf: [
                                // 这里匹配 `<style module>`
                                {
                                    resourceQuery: /module/,
                                    use: [
                                        vueStyleLoader,
                                        {
                                            loader: cssLoader,
                                            options: {
                                                modules: {
                                                    localIdentName:
                                                        'moduleStyle_[local]_[contenthash:8]'
                                                }
                                            }
                                        },
                                        {
                                            loader: postcssLoader,
                                            options: {
                                                postcssOptions: {
                                                    plugins: [['autoprefixer']]
                                                }
                                            }
                                        },
                                        lessLoader
                                    ]
                                },
                                // 这里匹配普通的 `<style>` 或 `<style scoped>`
                                {
                                    use: [
                                        env === 'dev'
                                            ? vueStyleLoader
                                            : MiniCssExtractPlugin.loader,
                                        cssLoader,
                                        {
                                            loader: postcssLoader,
                                            options: {
                                                postcssOptions: {
                                                    plugins: [['autoprefixer']]
                                                }
                                            }
                                        },
                                        lessLoader
                                    ]
                                }
                            ]
                        },
                        {
                            test: /\.scss$/,

                            oneOf: [
                                // 这里匹配 `<style module>`
                                {
                                    resourceQuery: /module/,
                                    use: [
                                        vueStyleLoader,
                                        {
                                            loader: cssLoader,
                                            options: {
                                                modules: {
                                                    localIdentName:
                                                        'moduleStyle_[local]_[contenthash:8]'
                                                }
                                            }
                                        },
                                        {
                                            loader: postcssLoader,
                                            options: {
                                                postcssOptions: {
                                                    plugins: [['autoprefixer']]
                                                }
                                            }
                                        },
                                        sassLoader
                                    ]
                                },
                                // 这里匹配普通的 `<style>` 或 `<style scoped>`
                                {
                                    use: [
                                        env === 'dev'
                                            ? vueStyleLoader
                                            : MiniCssExtractPlugin.loader,
                                        cssLoader,
                                        {
                                            loader: postcssLoader,
                                            options: {
                                                postcssOptions: {
                                                    plugins: [['autoprefixer']]
                                                }
                                            }
                                        },
                                        sassLoader
                                    ]
                                }
                            ]
                        },
                        {
                            test: /\.(jpg|png|gif|webp|bmp|jpeg|svg)$/,
                            type: 'asset', //在导出一个 data URI 和发送一个单独的文件之间自动选择
                            generator: {
                                filename: 'images/[name]_[contenthash][ext]' // 独立的配置
                            }
                        },
                        // 字体文件
                        {
                            test: /\.(otf|eot|woff2?|ttf)$/i,
                            type: 'asset', //在导出一个 data URI 和发送一个单独的文件之间自动选择
                            generator: {
                                filename: 'fonts/[name]_[contenthash][ext]'
                            }
                        },
                        // 数据文件
                        {
                            test: /\.(txt|xml)$/i,
                            type: 'asset/source'
                        },
                        {
                            test: /\.html$/,
                            loader: require.resolve('html-loader')
                        }
                    ]
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js', '.vue', '.json'],
            alias: {
                '@': path.join(projectPath, '/src'),
                // 兼容 支持vue运行时Options语法
                vue: 'vue/dist/vue.esm-bundler.js',
                'vue-router': path.dirname(require.resolve('vue-router')),
                qs: path.dirname(require.resolve('qs')),
                ...getCustomAliasConfig()
            }
        },
        externals: customConfig.base.externals,
        plugins: [
            ...basicPlugins,
            new VueLoaderPlugin(),
            //正在运行 Vue 的 esm-bundler 构建，它希望这些编译时的功能标志通过 bundler 配置全局注入，以便在生产包中获得更好的摇树优化
            new webpack.DefinePlugin({
                __VUE_OPTIONS_API__: true, //启用选项式 API 支持
                __VUE_PROD_DEVTOOLS__: false, //在生产环境中禁用开发者工具支持
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false //禁用生产环境构建下激活 (hydration) 不匹配的详细警告
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
                    publicPath,
                    routerBase
                },
                hash: true //对html引用的js文件添加hash戳
            }),

            //提取css文件
            new MiniCssExtractPlugin({
                filename: env === 'dev' ? 'css/[name].css' : 'css/[name].[contenthash].css',
                ignoreOrder: true
            }),
            ...(customBaseConfig?.plugins || initConfig.plugins)
        ]
    };
}
