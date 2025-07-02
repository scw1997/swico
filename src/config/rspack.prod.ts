import BundleAnalyzer from 'webpack-bundle-analyzer';
import path from 'path';
import fs from 'fs-extra';
import { initConfig, GlobalData } from '../utils/config';
import { merge } from 'webpack-merge';
import { rspack } from '@rspack/core';

const BundleAnalyzerPlugin = BundleAnalyzer.BundleAnalyzerPlugin;
const isAnalyze = process.env.ANALYZE === 'true';

export default async function (options: GlobalData) {
    const { projectPath, customConfig, templateType } = options;

    //根据模板类型按需引入配置
    const getBaseConfig = (
        await import(templateType === 'vue' ? './rspack.base.vue' : './rspack.base.react')
    ).default;

    const baseConfig = await getBaseConfig({
        ...options,
        env: 'prod'
    } as GlobalData);
    const consoleAvailable = customConfig.prod?.console ?? initConfig.console;
    //处理public文件夹（静态资源）
    const isPublicDirExist = await fs.exists(path.join(projectPath, '/public'));
    //处理其他自定义复制输出目录的文件
    const copyConfig = customConfig.prod?.copy ?? initConfig.copy;

    //自定义的sourcemap生成方式
    const customDevtool = customConfig.prod.devtool ?? customConfig.base.devtool;
    return merge(baseConfig, {
        // @ts-ignore
        output: {
            //配置主入口和chunk css文件输出路径和名称
            cssFilename: 'css/[name].[contenthash].css',
            cssChunkFilename: 'css/[name].[contenthash].css'
        },
        performance: {
            hints: false //不显示性能警告信息
        },
        mode: 'production',
        devtool: customDevtool ?? undefined, // production
        optimization: {
            //减少 entry chunk 体积，提高性能。
            runtimeChunk: true,
            minimize: true,

            minimizer: [
                new rspack.SwcJsMinimizerRspackPlugin({
                    minimizerOptions: {
                        minify: true,
                        mangle: true,
                        compress: {
                            passes: 2,
                            // 是否需要移除console
                            drop_console: !consoleAvailable
                        },
                        format: {
                            //是否移除注释,false表示是
                            comments: false
                        }
                    }
                }),
                new rspack.LightningCssMinimizerRspackPlugin({})
            ]
            //代码分割相关配置rspack已内置，不再需要手动配置
        },
        plugins: [
            //复制静态资源文件
            ...(isPublicDirExist || copyConfig.length > 0
                ? [
                      new rspack.CopyRspackPlugin({
                          patterns: [
                              ...(isPublicDirExist ? [path.join(projectPath, '/public')] : []),
                              ...(copyConfig || [])
                          ]
                      })
                  ]
                : []),
            //启动分析插件
            ...(isAnalyze
                ? [
                      new BundleAnalyzerPlugin({
                          analyzerMode: 'server',
                          analyzerHost: '127.0.0.1',
                          analyzerPort: 'auto', // 运行后的端口号
                          reportFilename: 'report.html',
                          defaultSizes: 'stat',
                          openAnalyzer: true,
                          generateStatsFile: false, //是否生成分析文件
                          statsFilename: 'analyze.json',
                          statsOptions: null,
                          logLevel: 'info'
                      })
                  ]
                : []),

            ...(customConfig.prod?.plugins ?? [])
        ]
    });
}
