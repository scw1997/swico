import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import getStartConfig from '../config/webpack.dev';
import { getPort, initIndexFile, toast } from '../utils/tools';
import { getProjectConfig } from '../utils/config';
import chokidar from 'chokidar';
import spawn from 'cross-spawn';
import path from 'path';
const { SWICO_PORT, SWICO_RESTART, SWICO_ROUTER_BASE } = process.env;
import packageJson from '../../package.json';
import { WebpackCompiler } from 'webpack-cli';
import chalk from 'chalk';

// 当前开发服务器的端口号和routerBase值的缓存
let currentPort,
    currentRouterBase = '/';

//监听ts全局声明文件和cli config文件修改
const handleWatch = (projectPath, devServer) => {
    //监听配置文件修改，重启服务
    const configFilesWatcher = chokidar
        .watch([path.join(projectPath, '/config/*.ts'), path.join(projectPath, '/.eslintrc')], {
            interval: 500,
            binaryInterval: 500,
            ignoreInitial: true
        })
        .on('all', async (path, stats) => {
            toast.warning('Swico configuration files changed, restarting server...', {
                inline: true
            });
            await devServer.stop();
            await configFilesWatcher.close();
            restartServer();
        });
    //监听ts声明重命名或新建操作(解决声明文件重命名等特殊情况下Ts类型校验延迟的异常）和部分其他文件，重启服务
    const tsTypingsWatcher = chokidar
        .watch(
            [
                path.join(projectPath, '/src/**/*.d.ts'),
                path.join(projectPath, '/src/loading/index.tsx'),
                path.join(projectPath, '/src/global.css'),
                path.join(projectPath, '/src/global.less'),
                path.join(projectPath, '/src/global.scss')
            ],
            {
                interval: 500,
                binaryInterval: 500,
                ignoreInitial: true
            }
        )
        .on('all', async (eventName, path, stats) => {
            if (['add', 'unlink'].includes(eventName)) {
                await devServer.stop();
                await tsTypingsWatcher.close();
                restartServer();
            }
        });
};

// 重启服务（因为需要重新读取配置文件，所以不能直接调用start）
const restartServer = () => {
    const result = spawn.sync(
        'cross-env',
        [
            'SWICO_RESTART=true',
            `SWICO_PORT=${currentPort}`,
            `SWICO_ROUTER_BASE=${currentRouterBase}`,
            'swico',
            'start'
        ],
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
        toast.info('Compiling...');
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
                    toast.warning(msg, { title: 'ESLint errors' });
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
    // console.log('env', SWICO_RESTART, SWICO_PORT, SWICO_ROUTER_BASE);
    process.env.SWICO_ENV = 'dev';
    if (SWICO_RESTART !== 'true') {
        toast.info(`Swico v${packageJson.version}`);
        toast.info('Initializing development config...');
    }

    await initIndexFile();
    //获取可用端口（优先使用重启时的传递的port环境变量）
    const availablePort = SWICO_RESTART === 'true' ? Number(SWICO_PORT) : await getPort();
    // @ts-ignore
    const projectConfig = await getProjectConfig('dev');

    const { projectPath, customConfig } = projectConfig;
    const newRouterBase =
        customConfig['dev']?.router?.base ?? customConfig['base']?.router?.base ?? '/';
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
        process.env.SWICO_PORT = availablePort.toString();
        //监听编译细节
        createCompileListener(compiler);
        // 还原devServer 日志输出
        compiler.getInfrastructureLogger = oriLogger;
        handleWatch(projectPath, devServer);
        if (
            SWICO_RESTART !== 'true' ||
            (SWICO_RESTART === 'true' && newRouterBase !== SWICO_ROUTER_BASE)
        ) {
            toast.info(
                `Project is running at：${chalk.hex('#29abe0')(`${startConfig.devServer.server}://localhost:${availablePort}${newRouterBase}`)}`
            );
        }
        currentRouterBase = newRouterBase;
        currentPort = availablePort;
    } catch (e) {
        const strErr = e.toString();
        toast.error(strErr);
    }
}
