
import getStartConfig from '../config/rsbpack.dev';
import { colorConfig, getPort, initIndexFile, toast } from '../utils/tools';
import {
    getProjectConfig,
    handleGlobalStyleFile,
    handleLoadingFile,
    updateIndexFileText
} from '../utils/config';
import chokidar from 'chokidar';
import spawn from 'cross-spawn';
import path from 'path';
const { SWICO_PORT, SWICO_RESTART, SWICO_ROUTER_BASE } = process.env;
import packageJson from '../../package.json';
import chalk from 'chalk';
import { RspackDevServer } from '@rspack/dev-server';
import fs from 'fs-extra';
import {Compiler, MultiCompiler, rspack} from '@rspack/core';


// 当前开发服务器的端口号和routerBase值的缓存
let currentPort,
    currentRouterBase = '/';

//监听ts全局声明文件和cli config文件修改
const handleWatch = (projectPath, devServer, env) => {
    const envPath = env === 'dev' ? '/.dev/' : '/.prod/';

    //监听配置文件修改，重启服务
    const configFilesWatcher = chokidar
        .watch([path.join(projectPath, '/config/*.ts'), path.join(projectPath, '/.eslintrc')], {
            interval: 500,
            binaryInterval: 500,
            ignoreInitial: true,
            ignored: [path.join(projectPath, '/config/swico.prod.ts')] //生产环境配置改变不需要重启
        })
        .on('all', async (path, stats) => {
            toast.warning('Configuration files changed, restarting server...', {
                inline: true
            });
            await devServer.stop();
            await configFilesWatcher.close();
            restartServer();
        });
    //监听ts声明重命名或新建操作(解决声明文件重命名等特殊情况下Ts类型校验延迟的异常）和部分其他文件，重启服务
    const globalStyleFilesPathList = [
        path.join(projectPath, '/src/global.css'),
        path.join(projectPath, '/src/global.less'),
        path.join(projectPath, '/src/global.scss')
    ];
    // 监听react模板中loading文件变化
    const loadingFilePath = path.join(projectPath, '/src/loading/index.tsx');
    const tsTypingsWatcher = chokidar
        .watch([path.join(projectPath, '/src/**/*')], {
            interval: 500,
            binaryInterval: 500,
            ignoreInitial: true
        })
        .on('all', async (eventName, filePath, stats) => {
            // console.log('eventName', eventName, filePath);
            let replaceIndexText = await fs.readFile(
                path.resolve(projectPath, `./.swico${envPath}index.js`),
                'utf8'
            );

            if (['add', 'unlink'].includes(eventName)) {
                switch (true) {
                    case filePath.endsWith('.d.ts'):
                        await devServer.stop();
                        await tsTypingsWatcher.close();
                        restartServer();
                        break;
                    case globalStyleFilesPathList.includes(filePath):
                        replaceIndexText = handleGlobalStyleFile(replaceIndexText);
                        //更新index.js
                        await updateIndexFileText(envPath, replaceIndexText);
                        break;
                    case filePath === loadingFilePath:
                        replaceIndexText = await handleLoadingFile(replaceIndexText, envPath);
                        //更新index.js
                        await updateIndexFileText(envPath, replaceIndexText);
                }
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
        toast.error(result.error.message);
        process.exit(1);
    }
};

// 覆盖devServer初始输出信息的方法
const getMockGetLogger = (compiler: Compiler) => {
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

const filterStyleFileList = [
    'Can\'t resolve \'../../src/global.less\'',
    'Can\'t resolve \'../../src/global.css\'',
    'Can\'t resolve \'../../src/global.scss\'',
    'Can\'t resolve \'../../src/loading\''
];
const createCompileListener = (compiler: MultiCompiler) => {
    // @ts-ignore
    compiler.hooks.beforeCompile.tap('beforeCompile', () => {
        toast.info('Compiling...');
    });
    compiler.hooks.done.tap('done', (stats) => {
        // @ts-ignore
        const info = stats?.toJson();
        if (stats?.hasErrors()) {
            // 将关于全局样式文件global.css|less|scss删除后路径错误的相关问题过滤，不显示报错，交给上述handleWatch做监听处理
            // console.log('1', info);
            toast.error(
                info?.errors
                    .map((item) => item.message || item.stack)
                    .filter((item1) => !filterStyleFileList.find((item2) => item1.includes(item2)))
            );
            return;
        }
        // 对webpack warning只处理eslint报错，其余忽略且不提示
        if (stats?.hasWarnings()) {
            // console.log('warning', info);
            const warnings = info.warnings;
            warnings.some((item) => {
                const msg = item.message || item.stack;
                if (msg.includes('[eslint]')) {
                    toast.warning(msg, { title: 'ESLint errors' });
                    return;
                }
            });
        }
        toast.info(`Compiled ${info?.time ? `in ${(info.time / 1000).toFixed(2)}s` : ''}`);
    });


};

// 执行start本地启动
export default async function start() {
    // console.log('env', SWICO_RESTART, SWICO_PORT, SWICO_ROUTER_BASE);
    process.env.SWICO_ENV = 'dev';
    if (SWICO_RESTART !== 'true') {
        console.log('\n');
        toast.info(`Swico v${packageJson.version}`);
        toast.info('Initializing development config...');
    }

    await initIndexFile();
    //获取可用端口（优先使用重启时的传递的port环境变量）
    const availablePort = SWICO_RESTART === 'true' ? Number(SWICO_PORT) : await getPort();
    // @ts-ignore
    const projectConfig = await getProjectConfig('dev');

    const { projectPath, customConfig, env } = projectConfig;
    const newRouterBase =
        customConfig['dev']?.router?.base ?? customConfig['base']?.router?.base ?? '/';
    const startConfig = await getStartConfig(projectConfig);
    const compiler = rspack(startConfig as any);

    // 覆盖devServer初始输出信息的方法
    const oriLogger = compiler.getInfrastructureLogger;
    // @ts-ignore
    compiler.getInfrastructureLogger = getMockGetLogger(compiler);
    //启动服务
    const devServer = new RspackDevServer(
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
        handleWatch(projectPath, devServer, env);
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
        // console.log('2222222', strErr);
        if (!filterStyleFileList.find((item) => strErr.includes(item))) {
            toast.error(strErr);
        }
    }
}
