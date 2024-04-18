import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import getStartConfig from '../config/webpack.dev';
import { getPort, initIndexFile, toast } from '../utils/tools';
import { getProjectConfig } from '../utils/config';
import chokidar from 'chokidar';
import path from 'path';
import spawn from 'cross-spawn';
const { PORT: envPort, RESTART } = process.env;
import packageJson from '../../package.json';
//监听ts全局声明文件和cli config文件修改
const handleWatch = (projectPath, devServer) => {
    //监听配置文件修改，重启服务
    const configFilesWatcher = chokidar
        .watch(
            [
                path.join(projectPath, '/config/*.ts'),
                path.join(projectPath, '/.eslintrc'),
                path.join(projectPath, '/src/loading/index.tsx'),
                path.join(projectPath, '/src/global.less')
            ],
            {
                interval: 500,
                binaryInterval: 500,
                ignoreInitial: true
            }
        )
        .on('all', async (path, stats) => {
            toast.warning(
                'Swico configuration files have been modified. The devServer is being restarted...'
            );

            await devServer.stop();
            await configFilesWatcher.close();
            restartServer();
        });
    //监听ts声明重命名或新建操作，重启服务（解决声明文件重命名等特殊情况下Ts类型校验延迟的异常）
    const tsTypingsWatcher = chokidar
        .watch([path.join(projectPath, '/src/**/*.d.ts')], {
            interval: 500,
            binaryInterval: 500,
            ignoreInitial: true
        })
        .on('all', async (eventName, path, stats) => {
            if (['add', 'unlink'].includes(eventName)) {
                await devServer.stop();
                await tsTypingsWatcher.close();
                restartServer();
            }
        });
};

let availablePort; //若是更新重启的情况，则用缓存的端口，不用新端口
const restartServer = () => {
    const result = spawn.sync(
        'cross-env',
        [`PORT=${availablePort}`, 'RESTART=true', 'swico', 'start'],
        {
            stdio: 'inherit'
        }
    );
    if (result.error) {
        toast.error(result.error.message());
        process.exit(1);
    }
};

// 执行start本地启动
export default async function start() {
    process.env.SWICO_ENV = 'dev';
    if (RESTART !== 'true') {
        toast.info(`Swico v${packageJson.version}`);
        toast.info('Initializing Swico development config...');
    }

    await initIndexFile();
    //获取可用端口（优先使用重启时的传递的port环境变量）
    availablePort = envPort ?? (await getPort());
    // @ts-ignore
    const projectConfig = await getProjectConfig('dev');

    const { projectPath } = projectConfig;

    const startConfig = await getStartConfig(projectConfig);
    const compiler = webpack(startConfig as any);
    //启动服务
    const devServer = new WebpackDevServer(
        // @ts-ignore
        { ...startConfig.devServer, port: availablePort },
        compiler
    );

    try {
        await devServer.start();
        handleWatch(projectPath, devServer);
    } catch (e) {
        const strErr = e.toString();
        toast.error(strErr);
    }
}
