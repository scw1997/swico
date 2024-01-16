import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import BundleAnalyzer from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';
import fs from 'fs';
import { initConfig, GlobalData } from '../utils/tools';
import { merge } from 'webpack-merge';
import getBaseConfig from './webpack.base';

const BundleAnalyzerPlugin = BundleAnalyzer.BundleAnalyzerPlugin;
const isAnalyze = process.env.ANALYZ === 'true';

export default async function (options: GlobalData) {
    const { projectPath, customConfig, templatePath } = options;

    const baseConfig = await getBaseConfig({ ...options, env: 'prod' });
    const consoleAvailable = customConfig.prod?.console ?? initConfig.console;
    //处理public文件夹（静态资源）
    const isCopyPathExist = fs.existsSync(path.join(projectPath, '/public'));

    return merge(baseConfig, {
        // @ts-ignore
        //控制输出文件大小的警告提示，单位字节

        performance: {
            hints: false //不显示性能警告信息
        },
        mode: 'production',
        stats: {
            preset: 'errors-only',
            chunks: true,
            assets: true,
            outputPath: true,
            assetsSort: '!size',
            chunksSort: '!size'
        },
        devtool: 'nosources-source-map', // production
        optimization: {
            //减少 entry chunk 体积，提高性能。
            runtimeChunk: true,
            minimize: true,
            minimizer: [
                //压缩css
                new CssMinimizerPlugin({
                    parallel: true, // 启动多线程压缩
                    minimizerOptions: {
                        preset: 'advanced' // cssnano https://cssnano.co/docs/optimisations/
                    }
                }),
                //webpack5默认压缩js，但是用了css-miniizer，需要手动压缩js
                new TerserPlugin({
                    test: /\.js$/,
                    terserOptions: {
                        compress: {
                            // eslint-disable-next-line camelcase
                            drop_console: !consoleAvailable, //删除console
                            // eslint-disable-next-line camelcase
                            drop_debugger: true // 删除deubgger语句
                        },

                        output: {
                            comments: false // 删除注释
                        }
                    }
                })
            ],
            splitChunks: {
                // include all types of chunks
                chunks: 'all',
                // 重复打包问题
                cacheGroups: {
                    vendors: {
                        // node_modules里的代码
                        test: /[\\/]node_modules[\\/]/,
                        chunks: 'all',
                        // name: 'vendors', //一定不要定义固定的name
                        priority: 10, // 优先级
                        enforce: true
                    }
                }
            }
        },
        plugins: [
            new CssMinimizerPlugin(),
            //复制静态资源文件
            ...(isCopyPathExist
                ? [
                      new CopyPlugin({
                          patterns: [path.join(projectPath, '/public')]
                      })
                  ]
                : []),
            //启动分析插件
            ...(isAnalyze
                ? [
                      new BundleAnalyzerPlugin({
                          analyzerMode: 'server',
                          analyzerHost: '127.0.0.1',
                          analyzerPort: 8888, // 运行后的端口号
                          reportFilename: 'report.html',
                          defaultSizes: 'parsed',
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
