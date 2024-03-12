import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import getStartConfig from '../config/webpack.dev';
import { getPort } from '../utils/tools';
import { getProjectConfig } from '../utils/config';
import ora from 'ora';
import chokidar from 'chokidar';
import path from 'path';
import chalk from 'chalk';
import spawn from 'cross-spawn';
const { PORT: envPort, TEMPLATE } = process.env;

const spinner = ora();

//监听ts全局声明文件和cli config文件修改
const handleWatch = (projectPath, devServer) => {
    //监听配置文件修改，重启服务
    const configFilesWatcher = chokidar
        .watch(
            [
                path.join(projectPath, '/config/secywo.ts'),
                path.join(projectPath, '/config/secywo.dev.ts'),
                path.join(projectPath, '/config/secywo.prod.ts'),
                path.join(projectPath, '/.eslintrc')
            ],
            {
                interval: 500,
                binaryInterval: 500,
                ignoreInitial: true
            }
        )
        .on('all', async (path, stats) => {
            console.log(
                `\n${chalk
                    .hex('#fb8918')
                    .bold(
                        'Secywo configuration files have been modified. The devServer is being restarted...'
                    )}\n`
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
    const result = spawn.sync('cross-env', [`PORT=${availablePort}`, 'secywo', 'start'], {
        stdio: 'inherit'
    });
    if (result.error) {
        spinner.fail(`- ${chalk.bold('There are some errors：')} \n`);

        console.log(`- ${chalk.red.bold(result.error.message())} \n`);
        process.exit(1);
    }
};

// 执行start本地启动
export default async function start() {
    //获取可用端口（优先使用重启时的传递的port环境变量）
    availablePort = envPort ?? (await getPort());
    // @ts-ignore
    const projectConfig = await getProjectConfig(TEMPLATE, 'dev');
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
        spinner.fail(`${chalk.bold('There are some errors：')}\n`);
        console.error(`- ${chalk.red.bold(strErr)} \n`);
    }
}
