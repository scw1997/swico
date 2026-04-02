import { initConfig, GlobalDataType, customLogger } from '../main-config';
import path from 'path';
import EslintPlugin from 'eslint-rspack-plugin';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';
import { toast } from '../utils';
import { mergeRsbuildConfig, RsbuildConfig } from '@rsbuild/core';
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl';

export default async function (options: GlobalDataType) {
    const { projectPath, customConfig, templateType, entryPath, env } = options;
    //根据模板类型按需引入配置
    const getBaseConfig = (
        await import(templateType === 'vue' ? './config.base.vue' : './config.base.react')
    ).default;
    const publicPath = customConfig?.base?.publicPath ?? initConfig.publicPath;
    const baseConfig = await getBaseConfig({
        ...options,
        env: 'dev'
    } as GlobalDataType);

    //用户自定义的sourceMap生成方式
    const customDevtool = customConfig.dev.devtool ?? customConfig.base.devtool;

    return mergeRsbuildConfig(baseConfig, {
        mode: 'development',
        server: {
            base: publicPath,
            compress: true, //启动gzip压缩,
            headers: customConfig?.dev?.responseHeaders ?? initConfig.responseHeaders,
            historyApiFallback: {
                index: `${baseConfig.output.publicPath}index.html`
            },
            proxy: customConfig?.dev?.proxy ?? initConfig.proxy,
            open: false //不自动打开浏览器
        },
        dev: {
            client: {
                overlay: false, //错误，警告不会覆盖页面
                logLevel: 'error', //浏览器控制台只输出报错信息
                hmr: true, //热更新
                lazyCompilation: true, //按需编译
                progress: false //不显示构建进度条
            },

            assetPrefix: publicPath //静态资源 URL 前缀,一般与publicPath一致
        },
        output: {
            sourceMap: {
                js:
                    templateType === 'vue'
                        ? (customDevtool ?? 'cheap-module-source-map')
                        : (customDevtool ?? 'eval-cheap-module-source-map'),
                css: false,
                extract: false
            }
        },
        plugins: [
            ...(customConfig.dev.https === true ? [pluginBasicSsl()] : []),
            //ts类型检查
            new TsCheckerRspackPlugin({
                logger: {
                    log: () => {},
                    error: (message) => {
                        toast.error(message, { title: 'TypeScript errors' });
                    }
                },
                typescript: {
                    memoryLimit: 15000, //增加进程内存限制，默认为8192
                    diagnosticOptions: {
                        semantic: true,
                        syntactic: true
                    }
                }
            }),
            new EslintPlugin({
                configType: 'flat',
                context: path.join(projectPath, '/src'),
                //禁用报错则停止编译，将错误信息传给webpack统一格式化输出
                failOnError: false,
                failOnWarning: true,
                extensions: templateType === 'vue' ? ['vue', 'ts', 'js'] : ['tsx', 'ts', 'js'],
                // emitError: false,

                emitWarning: false,
                // 开启缓存
                cache: true
                // 指定缓存目录
                // cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintCache'),
                // 开启多进程和进程数量（可能服务卡死）
                // threads: coreNum
            }),
            ...(customConfig.dev?.plugins ?? [])
        ]
    }) as RsbuildConfig;
}
