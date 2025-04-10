import { initConfig, GlobalData } from '../utils/config';
import path from 'path';
import { merge } from 'webpack-merge';
import EslintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { toast } from '../utils/tools';

export default async function (options: GlobalData) {
    const { projectPath, customConfig, templateType, entryPath, env } = options;
    //根据模板类型按需引入配置
    const getBaseConfig = (
        await import(templateType === 'vue' ? './webpack.base.vue' : './webpack.base.react')
    ).default;

    const baseConfig = await getBaseConfig({
        ...options,
        env: 'dev'
    } as GlobalData);

    //自定义的sourcemap生成方式
    const customDevtool = customConfig.dev.devtool ?? customConfig.base.devtool;

    return merge(baseConfig, {
        // @ts-ignore
        mode: 'development',
        stats: 'none', //不输出打包信息，自主捕获处理报错信息
        devtool:
            templateType === 'vue'
                ? customDevtool ?? 'cheap-module-source-map'
                : customDevtool ?? 'eval-cheap-module-source-map', // development
        devServer: {
            //使用HTML5 History API时，index.html可能需要提供页面来代替任何404响应。
            historyApiFallback: {
                index: `${baseConfig.output.publicPath}index.html`
            },
            client: {
                logging: 'error',
                progress: false, //显示进度条
                //错误，警告不会覆盖页面
                overlay: false
            },
            proxy: customConfig?.dev?.proxy ?? initConfig.proxy,
            compress: true, //启动gzip压缩
            hot: true, //热更新
            open: false, //是否自动打开浏览器,
            static: {
                //提供静态文件服务的路径
                directory: path.join(projectPath, '/public')
            },
            server: customConfig.dev.https === true ? 'https' : 'http'
        },
        plugins: [
            //ts类型检查
            new ForkTsCheckerWebpackPlugin({
                logger: {
                    log: () => {},
                    error: (message) => {
                        toast.error(message, { title: 'TypeScript errors' });
                    }
                },
                typescript: {
                    diagnosticOptions: {
                        semantic: true,
                        syntactic: true
                    }
                }
            }),
            new EslintPlugin({
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
    });
}
