import fs from 'fs';
import path from 'path';
import portFinder from 'portfinder';

interface CliConfigFields {
    plugins?: any[];
    publicPath?: string;
    console?: boolean; //是否需要保留console
    define?: Record<string, any>;
    alias?: Record<string, any>;
    proxy?: Record<string, any>;
}

export interface GlobalData {
    projectPath: string; //模板项目根路径
    entryPath: string; //入口文件路径
    templatePath: string; //html模板文件路径
    env?: 'dev' | 'prod'; //当前调用环境
    customConfig: {
        //脚手架自定义配置
        base: Pick<CliConfigFields, 'plugins' | 'publicPath' | 'alias' | 'define'>; //公共通用
        dev: Pick<CliConfigFields, 'plugins' | 'proxy'>; //开发环境专用
        prod: Pick<CliConfigFields, 'plugins' | 'console'>; //生产环境专用
    };
}

//获取开发者的自定义项目配置和相关参数
export const getProjectConfig: () => Promise<GlobalData> = async () => {
    // 当前命令行选择的目录(即项目根路径)
    const cwd = process.cwd();
    //secywo 配置文件路径
    const configDir = path.join(cwd, '/config');
    // 脚手架对应的配置文件信息
    const configPath = {
        dev: path.join(configDir, '/secywo.dev.ts'),
        prod: path.join(configDir, '/secywo.prod.ts'),
        base: path.join(configDir, '/secywo.ts')
    };

    const customConfig = {} as GlobalData['customConfig'];
    //读取各环境配置文件并写入

    for (const key of Object.keys(configPath)) {
        const curConfigFilePath = configPath[key];
        const exists = fs.existsSync(curConfigFilePath);
        //存在则读取

        if (exists) {
            customConfig[key] = (await import(curConfigFilePath)).default;
        }
    }

    //webpack入口文件
    const entryPath = path.join(cwd, '/src/index.tsx');
    //webpack html template
    const templatePath = path.join(cwd, '/src/index.ejs');

    return {
        projectPath: cwd,
        entryPath,
        templatePath,
        customConfig
    };
};

//获取随机可用的接口（解决devServer接口占用报错的问题）
export const getPort = () => {
    return portFinder.getPortPromise({
        port: 3000, // minimum port
        stopPort: 3333 //
    });
};

export const getFormatDefineVars = (defineVarsConfigObj) => {
    const formatObj = {};
    for (const [key, value] of Object.entries(defineVarsConfigObj)) {
        formatObj[key] = JSON.stringify(value);
    }
    return formatObj;
};

//部分secywo配置项的初始默认值
export const initConfig: CliConfigFields = {
    console: true,
    plugins: [],
    publicPath: '/',
    proxy: undefined
};
