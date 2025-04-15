import path from 'path';
import { getFormatDefineVars, initConfig, GlobalData } from '../utils/config';
import { VueLoaderPlugin } from 'vue-loader';
import {CssExtractRspackPlugin, rspack} from '@rspack/core';
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
        basicPlugins.push(new rspack.DefinePlugin(formatObj));
    }

    return {
        //入口文件路径
        entry: entryPath,
        //打包后文件路径
        output: {
            path: path.join(projectPath, '/dist'),
            //配置bundle js输出路径和名称
            filename: 'js/[name].[chunkhash].js',
            chunkFilename: 'js/[name].[chunkhash].js',
            //配置css文件输出路径和名称
            cssFilename:'css/[name].[contenthash].css',
            cssChunkFilename:'css/[name].[contenthash].css',
            // 静态文件打包后的路径及文件名（默认是走全局的，如果有独立的设置就按照自己独立的设置来。）
            assetModuleFilename: 'assets/[name]_[id][ext]',
            publicPath,
            clean: true
        },
        // 开启原生支持css
        experiments: {
            css: true
        },
        target: ['web', 'es5'], //webpack5默认生成es6，设置编译打包生成es5代码
        module: {
            parser:{
                'css/auto': {
                    namedExports: false //支持css modules默认导入
                }
            },
            rules: [
                {
                    test: /\.vue$/,
                    loader: require.resolve('vue-loader'),
                    exclude: /node_modules/,
                    options: {
                        // 注意，为了绝大多数功能的可用性，请确保该选项为 `true`
                        experimentalInlineMatchResource: true
                    }
                },
                {
                    test: /\.(ts|js)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'builtin:swc-loader',
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
                            test: /\.less$/,
                            type: 'css', //
                            loader:lessLoader
                        },
                        {
                            test: /\.scss$/,
                            type: 'css', //
                            loader:sassLoader,
                            options: {
                                // 同时使用 `modern-compiler` 和 `sass-embedded` 可以显著提升构建性能
                                // 需要 `sass-loader >= 14.2.1`
                                api: 'modern-compiler',
                                implementation: require.resolve('sass-embedded')
                            }
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
            new rspack.DefinePlugin({
                __VUE_OPTIONS_API__: true, //启用选项式 API 支持
                __VUE_PROD_DEVTOOLS__: false, //在生产环境中禁用开发者工具支持
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false //禁用生产环境构建下激活 (hydration) 不匹配的详细警告
            }),
            new rspack.HtmlRspackPlugin({
                //不使用默认html文件，使用自己定义的html模板并自动引入打包后的js/css
                template: path.join(projectPath, '/src/index.ejs'),
                filename: 'index.html', //打包后的文件名
                minify: true,
                templateParameters: {
                    publicPath,
                    routerBase
                },
                hash: true //对html引用的js文件添加hash戳
            }),

            ...(customBaseConfig?.plugins || initConfig.plugins)
        ]
    };
}
