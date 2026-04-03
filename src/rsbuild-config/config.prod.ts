import { initConfig, GlobalDataType, customLogger } from '../main-config';
import { mergeRsbuildConfig, RsbuildConfig } from '@rsbuild/core';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
const isAnalyze = process.env.ANALYZE === 'true';

export default async function (options: GlobalDataType) {
    const { projectPath, customConfig, templateType } = options;

    //根据模板类型按需引入配置
    const getBaseConfig = (
        await import(templateType === 'vue' ? './config.base.vue' : './config.base.react')
    ).default;

    const baseConfig = await getBaseConfig({
        ...options,
        env: 'prod'
    } as GlobalDataType);
    const consoleAvailable = customConfig.prod?.console ?? initConfig.console;
    //处理其他自定义复制输出目录的文件
    const copyConfig = customConfig.prod?.copy ?? initConfig.copy;

    return mergeRsbuildConfig(baseConfig, {
        output: {
            //默认情况下，Rsbuild 已将 public 目录作为静态资源服务的文件夹，此处仅处理额外自定义配置
            copy: copyConfig,
            sourceMap: {
                js: customConfig.prod.devtool ?? customConfig.base.devtool ?? false,
                css: false,
                extract: false
            }
        },
        performance: {
            removeConsole: !consoleAvailable,
            buildCache: true //开启构建缓存
        },
        mode: 'production',
        tools: {
            rspack: {
                plugins: [
                    // 构建产物分析采用rsdoctor插件
                    isAnalyze &&
                        new RsdoctorRspackPlugin({
                            // 插件选项
                        })
                ]
            }
        },
        plugins: [...(customConfig.prod?.plugins ?? [])]
    }) as RsbuildConfig;
}
