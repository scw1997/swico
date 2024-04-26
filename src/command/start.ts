import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import getStartConfig from '../config/webpack.dev';
import { getPort, initIndexFile, toast } from '../utils/tools';
import { getProjectConfig } from '../utils/config';
import chokidar from 'chokidar';
import path from 'path';
import ora from 'ora';
import spawn from 'cross-spawn';
const { PORT: envPort, RESTART } = process.env;
import packageJson from '../../package.json';
import { WebpackCompiler } from 'webpack-cli';
import chalk from 'chalk';

const spinner = ora();
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

// 覆盖devServer初始输出信息的方法
const getMockGetLogger = (compiler: WebpackCompiler) => {
    const logger = compiler.getInfrastructureLogger('name');
    const { log, debug, error, warn } = logger;
    return (name) => {
        return {
            ...logger,
            log,
            debug,
            error,
            warn,
            info: () => {}
        };
    };
};

const createCompileListener = (compiler: WebpackCompiler) => {
    // @ts-ignore
    compiler.hooks.beforeCompile.tap('beforeCompile', () => {
        toast.info('Compiling...', { wrap: false });
    });
    compiler.hooks.done.tap('done', (stats) => {
        const info = stats?.toJson();
        if (stats?.hasErrors()) {
            toast.error(info?.errors.map((item) => item.message || item.stack));
            return;
        }
        // 对webpack warning只处理eslint报错，其余忽略且不提示
        if (stats?.hasWarnings()) {
            const warnings = info.warnings;
            warnings.some((item) => {
                const msg = item.message || item.stack;
                if (msg.startsWith('[eslint]')) {
                    toast.warning(msg, 'ESLint errors');
                    return;
                }
            });
            return;
        }
        toast.info(`Compiled complete in ${info?.time}ms`);
    });
};

// 执行start本地启动
export default async function start() {
    process.env.SWICO_ENV = 'dev';
    if (RESTART !== 'true') {
        toast.info(`v${packageJson.version}`, { wrap: false });
        toast.info('Initializing development config...', { wrap: false });
    }

    await initIndexFile();
    //获取可用端口（优先使用重启时的传递的port环境变量）
    availablePort = envPort ?? (await getPort());
    // @ts-ignore
    const projectConfig = await getProjectConfig('dev');

    const { projectPath } = projectConfig;

    const startConfig = await getStartConfig(projectConfig);
    const compiler = webpack(startConfig as any);

    // 覆盖devServer初始输出信息的方法
    const oriLogger = compiler.getInfrastructureLogger;
    // @ts-ignore
    compiler.getInfrastructureLogger = getMockGetLogger(compiler);
    //启动服务
    const devServer = new WebpackDevServer(
        { ...startConfig.devServer, port: availablePort },
        compiler
    );

    try {
        //启动
        await devServer.start();
        //监听编译细节
        createCompileListener(compiler);
        // 还原devServer 日志输出
        compiler.getInfrastructureLogger = oriLogger;
        handleWatch(projectPath, devServer);
        toast.info(
            `Project is running at：${chalk.hex('#29abe0')(`${startConfig.devServer.server}://localhost:${availablePort}/`)}`,
            { wrap: false }
        );
    } catch (e) {
        const strErr = e.toString();
        toast.error(strErr);
    }
}
