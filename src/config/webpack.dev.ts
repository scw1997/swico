import getBaseConfig from './webpack.base';
import { initConfig, GlobalData } from '../utils/tools';
import path from 'path';
import { merge } from 'webpack-merge';
import EslintPlugin from 'eslint-webpack-plugin';

export default async function (options: GlobalData) {
    const { projectPath, customConfig,templateType } = options || {};
    const baseConfig = await getBaseConfig({ ...options, env: 'dev' });

    return merge(baseConfig, {
        //打包后文件路径
        // @ts-ignore
        mode: 'development',
        stats: 'errors-only',
        devtool: 'eval-cheap-module-source-map', // development
        devServer: {
            //使用HTML5 History API时，index.html可能需要提供页面来代替任何404响应。
            historyApiFallback: {
                index: `${baseConfig.output.publicPath}index.html`
            },
            client: {
                progress: false, //显示进度条
                //错误，警告不会覆盖页面
                overlay: false
            },
            proxy: customConfig?.dev?.proxy ?? initConfig.proxy,
            compress: true, //启动gzip压缩
            hot: true, //热更新
            open: false, //自动打开浏览器,
            static: {
                //提供静态文件服务的路径
                directory: path.join(projectPath, '/public')
            }
        },
        plugins: [
            new EslintPlugin({
                context: path.join(projectPath, '/src'),
                extensions: templateType==='vue'?['vue', 'ts', 'js']:['tsx', 'ts', 'js', 'jsx'],
                // 开启缓存
                cache: true
                // 指定缓存目录
                // cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintCache'),
                // 开启多进程和进程数量（可能服务卡死）
                // threads: coreNum
            }),
            ...(customConfig.dev?.plugins ?? [])
        ]
    });
}
