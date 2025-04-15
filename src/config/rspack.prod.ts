import BundleAnalyzer from 'webpack-bundle-analyzer';
import path from 'path';
import fs from 'fs-extra';
import { initConfig, GlobalData } from '../utils/config';
import { merge } from 'webpack-merge';
import WebpackBar from 'webpackbar';
import { colorConfig } from '../utils/tools';
import {rspack} from '@rspack/core';

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

    //处理public文件夹（静态资源）
    const isPublicDirExist = await fs.exists(path.join(projectPath, '/public'));
    //处理其他自定义复制输出目录的文件
    const copyConfig = customConfig.prod?.copy ?? initConfig.copy;

    //自定义的sourcemap生成方式
    const customDevtool = customConfig.prod.devtool ?? customConfig.base.devtool;

    return merge(baseConfig, {
        // @ts-ignore
        //控制输出文件大小的警告提示，单位字节

        performance: {
            hints: false //不显示性能警告信息
        },
        mode: 'production',
        devtool: customDevtool ?? undefined, // production
        optimization: {
            //减少 entry chunk 体积，提高性能。
            runtimeChunk: true,
            minimize: true,
            splitChunks: {
                chunks: 'all', //将多入口文件共享的模块提取到公共块
                // 定义缓存组，如将第三方库打包到单独的文件。解决重复打包问题
                cacheGroups: {
                    // 抽取第三方模块
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        chunks: 'all',
                        reuseExistingChunk: true
                    },
                    // 抽取
                    commons: {
                        minSize: 0, // 抽取的chunk最小大小
                        minChunks: 2, // 最小引用数
                        priority: -20,
                        chunks: 'all',
                        reuseExistingChunk: true
                    }
                }
            }
        },
        plugins: [
            //复制静态资源文件
            ...(isPublicDirExist || copyConfig.length > 0
                ? [
                      new rspack.CopyRspackPlugin({
                          patterns: [
                              ...(isPublicDirExist ? [path.join(projectPath, '/public')] : []),
                              ...copyConfig
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
            // 编译进度条
            new WebpackBar({
                name: 'Swico',
                color: colorConfig.theme,
                profile: false
            }),
            ...(customConfig.prod?.plugins ?? [])
        ]
    });
}
