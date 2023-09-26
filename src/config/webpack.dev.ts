import getBaseConfig from './webpack.base';
import { getPort, initConfig, GlobalData } from '../utils/tools';
import path from 'path';
import { merge } from 'webpack-merge';
export default async function (options: GlobalData) {
    const { projectPath, customConfig } = options || {};
    const baseConfig = await getBaseConfig({ ...options, env: 'dev' });
    //获取可用端口
    const port = await getPort();

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
        plugins: [...(customConfig.dev?.plugins ?? [])]
    });
}
