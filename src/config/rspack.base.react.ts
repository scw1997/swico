import path from 'path';
import { getFormatDefineVars, initConfig, GlobalData } from '../utils/config';
import { rspack } from '@rspack/core';
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
            //配置主入口和chunk js输出路径和名称
            filename: 'js/[name].[chunkhash].js',
            chunkFilename: 'js/[name].[chunkhash].js',
            //配置主入口和chunk css文件输出路径和名称（这里开发环境使用contenthash/chunkhash会有报错bug，所以暂切使用id）
            cssFilename: 'css/[id].css',
            cssChunkFilename: 'css/[id].css',
            // 静态文件打包后的路径及文件名（默认是走全局的，如果有独立的设置就按照自己独立的设置来。）
            assetModuleFilename: 'assets/[name]_[chunkhash][ext]',
            publicPath,
            clean: true
        },
        // 开启原生支持css
        experiments: {
            css: true
        },
        target: ['web', 'es2015'], //设置编译打包生成es2015代码

        module: {
            parser: {
                'css/auto': {
                    namedExports: false //支持css modules默认导入
                }
            },
            rules: [
                {
                    test: /\.(tsx|ts|jsx)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'builtin:swc-loader',
                            options: {
                                jsc: {
                                    parser: {
                                        syntax: 'typescript',
                                        tsx: true,
                                        decorators: true,
                                        dynamicImport: true
                                    },
                                    transform: {
                                        react: {
                                            runtime: 'automatic', // 使用自动的 JSX 运行时
                                            useBuiltins: true,
                                            importSource: 'react' // 指定从哪里自动引入JSX创建函数，对于 React 项目，这里应该是 "react"
                                        }
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
                            type: 'css/auto', // 智能识别普通css和module.css
                            use: [
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

                        {
                            test: /\.less$/,
                            type: 'css/auto', // 👈
                            use: [
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
                        {
                            test: /\.scss$/,
                            type: 'css/auto', // 👈
                            use: [
                                {
                                    loader: postcssLoader,
                                    options: {
                                        postcssOptions: {
                                            plugins: [['autoprefixer']]
                                        }
                                    }
                                },
                                {
                                    loader: sassLoader,
                                    options: {
                                        // 同时使用 `modern-compiler` 和 `sass-embedded` 可以显著提升构建性能
                                        // 需要 `sass-loader >= 14.2.1`
                                        api: 'modern-compiler',
                                        implementation: require.resolve('sass-embedded')
                                    }
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
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            alias: {
                '@': path.join(projectPath, '/src'),
                'react-router': path.dirname(require.resolve('react-router')),
                qs: path.dirname(require.resolve('qs')),
                ...getCustomAliasConfig()
            }
        },
        externals: customConfig.base.externals,
        plugins: [
            ...basicPlugins,
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
