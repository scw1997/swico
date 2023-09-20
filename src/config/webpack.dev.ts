import getBaseConfig from './webpack.base';
import { getFormatDefineVars, getPort, initConfig, ProjectConfigType } from '../utils/tools';
import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default async function (options: ProjectConfigType) {
    const { projectPath, customConfig } = options || {};
    const baseConfig = getBaseConfig({ ...options, env: 'dev' });
    //获取可用端口
    const port = await getPort();

    return merge(baseConfig, {
        //打包后文件路径
        // @ts-ignore
        mode: 'development',
        devtool: 'eval-cheap-module-source-map', // development
        devServer: {
            //使用HTML5 History API时，index.html可能需要提供页面来代替任何404响应。
            historyApiFallback: {
                index: `${baseConfig.output.publicPath}index.html`
            },
            port, //端口
            client: {
                progress: false, //显示进度条
                //警告不会覆盖页面
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
        plugins: [...(customConfig.dev.plugins ?? [])]
    });
}
