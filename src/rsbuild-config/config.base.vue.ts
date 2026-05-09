import path from 'path';
import { getFormatDefineVars, initConfig, GlobalDataType, customLogger } from '../main-config';
import { pluginVue } from '@rsbuild/plugin-vue';
import { RsbuildConfig } from '@rsbuild/core';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginLess } from '@rsbuild/plugin-less';

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
                //正在运行 Vue 的 esm-bundler 构建，它希望这些编译时的功能标志通过 bundler 配置全局注入，以便在生产包中获得更好的摇树优化
                __VUE_OPTIONS_API__: true, //启用选项式 API 支持
                __VUE_PROD_DEVTOOLS__: false, //在生产环境中禁用开发者工具支持
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false, //禁用生产环境构建下激活 (hydration) 不匹配的详细警告
                // 下面为Swico自定义配置变量
                ...initialDefineVarsConfig,
                ...customDefineVarsConfig
            }
        },
        logLevel: 'silent',
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
            extensions: ['.ts', '.js', '.vue', '.json'],
            alias: {
                '@': path.join(projectPath, '/src'),
                // 兼容 支持vue运行时Options语法
                vue: 'vue/dist/vue.esm-bundler.js',
                'vue-router': path.dirname(require.resolve('vue-router')),
                'swico/vue': path.join(projectPath, '/.swico/index'),
                swico: path.join(projectPath, '/.swico/index'),
                qs: path.dirname(require.resolve('qs')),
                ...getCustomAliasConfig()
            }
        },

        html: {
            template: path.join(projectPath, '/src/index.ejs'),
            templateParameters: initialDefineVarsConfig
        },
        plugins: [
            pluginVue(),
            pluginSass(),
            pluginLess(),
            ...(customBaseConfig?.plugins ?? initConfig.plugins)
        ]
    } as RsbuildConfig;
}
