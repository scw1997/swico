import path from 'path';
import { getFormatDefineVars, initConfig, GlobalDataType, customLogger } from '../main-config';
import { pluginReact } from '@rsbuild/plugin-react';
import { RsbuildConfig } from '@rsbuild/core';

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
        source: {
            entry: {
                index: entryPath
            },
            define: {
                ...initialDefineVarsConfig,
                ...customDefineVarsConfig
            }
        },
        logLevel: 'error',
        customLogger,
        output: {
            //构建产物的输出目录
            distPath: {
                root: path.join(projectPath, '/dist'),
                html: './',
                favicon: './',
                js: 'js',
                jsAsync: 'js/async',
                css: 'css',
                cssAsync: 'css/async',
                svg: 'static/svg',
                font: 'static/font',
                wasm: 'static/wasm',
                image: 'static/image',
                media: 'static/media',
                assets: 'static/assets'
            },
            assetPrefix: publicPath, //静态资源前缀，相当于publicPath
            cleanDistPath: true, //每次构建前清空dist目录
            cssModules: {
                auto: true, //自动为module.css文件开启css modules
                exportLocalsConvention: 'camelCase',
                localIdentName:
                    env === 'prod'
                        ? '[local]-[hash:base64:6]'
                        : '[path][name]__[local]-[hash:base64:6]'
            },
            dataUriLimit: {
                //设置图片、字体、媒体等静态资源被自动内联为 base64 的体积阈值。
                svg: 4096,
                font: 4096,
                image: 4096,
                media: 4096,
                assets: 4096
            },
            minify: true, //自动压缩代码
            emitCss: true, //是否将 CSS 输出到产物中。
            externals: customBaseConfig?.externals,
            target: 'web'
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

        html: {
            template: path.join(projectPath, '/src/index.ejs'),
            templateParameters: initialDefineVarsConfig
        },
        plugins: [pluginReact(), ...(customBaseConfig?.plugins ?? initConfig.plugins)]
    } as RsbuildConfig;
}
