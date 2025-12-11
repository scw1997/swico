import path from 'path';
import { getFormatDefineVars, initConfig, GlobalDataType } from '../main-config';
import { rspack } from '@rspack/core';
import HtmlWebpackPlugin from 'html-webpack-plugin';
const lessLoader = require.resolve('less-loader');
const sassLoader = require.resolve('sass-loader');
const postcssLoader = require.resolve('postcss-loader');

export default async function ({ projectPath, entryPath, env, customConfig }: GlobalDataType) {
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
    const publicPath = customBaseConfig?.publicPath ?? initConfig.publicPath;
    const routerBase = customBaseConfig?.router?.base ?? initConfig.router.base;
    //处理自定义变量
    //内置的一些变量
    const initialDefineVarsConfig = {
        SWICO_ENV: JSON.stringify(env),
        SWICO_ROUTER_BASE: JSON.stringify(routerBase),
        SWICO_PUBLIC_PATH: JSON.stringify(publicPath),
        SWICO_STATIC_PUBLIC_PATH: JSON.stringify(env === 'prod' ? publicPath : '/')
    };
    const customDefineVarsConfig = await getFormatDefineVars(customBaseConfig?.define ?? {});
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
                            use: [postcssLoader]
                        },

                        {
                            test: /\.less$/,
                            type: 'css/auto', // 👈
                            use: [postcssLoader, lessLoader]
                        },
                        {
                            test: /\.scss$/,
                            type: 'css/auto', // 👈
                            use: [
                                postcssLoader,
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
                'swico/react': path.join(projectPath, '/.swico/index'),
                swico: path.join(projectPath, '/.swico/index'),
                qs: path.dirname(require.resolve('qs')),
                ...getCustomAliasConfig()
            }
        },
        externals: customConfig.base.externals,
        plugins: [
            new HtmlWebpackPlugin({
                //不使用默认html文件，使用自己定义的html模板并自动引入打包后的js/css
                template: path.join(projectPath, '/src/index.ejs'),
                filename: 'index.html', //打包后的文件名
                minify: true,
                templateParameters: initialDefineVarsConfig,
                hash: true //对html引用的js文件添加hash戳
            }),
            new rspack.DefinePlugin({
                ...initialDefineVarsConfig,
                ...customDefineVarsConfig
            }),
            ...(customBaseConfig?.plugins ?? initConfig.plugins)
        ]
    };
}
