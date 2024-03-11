import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import * as process from 'process';
import { copyDir } from './tools';
const spinner = ora();

interface CliConfigFields {
    npmType?: 'npm' | 'pnpm'; //包管理工具
    plugins?: any[]; //webpack插件
    publicPath?: string; //非根路径部署所需要定义的base路径
    console?: boolean; //是否需要保留console
    define?: Record<string, any>; //定义代码中可直接使用的变量，属性值会默认被JSON.stringify()
    alias?: Record<string, any>; //定义import映射
    proxy?: Record<string, any>; //devServer中用到的proxy代理
    https?: boolean; //是否使用https开发服务器
    copy?: Array<string | { from: string; to: string }>; //复制指定文件(夹)到指定目录
    devtool?: string; //设置 sourcemap 生成方式
    externals?: any; //设置哪些模块不打包，转而在index.ejs中通过 <script> 或其他方式引入
}

export interface GlobalData {
    templateType?: 'vue' | 'react'; //模板类型
    projectPath: string; //模板项目根路径
    entryPath: string; //入口文件路径
    templatePath: string; //html模板文件路径
    env?: 'dev' | 'prod'; //当前调用环境
    customConfig: {
        //脚手架自定义配置
        base: Pick<
            CliConfigFields,
            'plugins' | 'publicPath' | 'alias' | 'define' | 'devtool' | 'externals' | 'npmType'
        >; //公共通用
        dev: Pick<CliConfigFields, 'plugins' | 'proxy' | 'https' | 'devtool'>; //开发环境专用
        prod: Pick<CliConfigFields, 'plugins' | 'console' | 'copy' | 'devtool'>; //生产环境专用
    };
}

//获取开发者的自定义项目配置和相关参数
export const getProjectConfig: (templateType?: 'vue' | 'react') => Promise<GlobalData> = async (
    templateType
) => {
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
            const configObj = (await import(curConfigFilePath)).default;
            const configFields = Object.keys(configObj);
            //对不支持的配置项字段进行报错提示
            let supportedFieldList, configFileName;
            switch (key) {
                case 'base':
                    supportedFieldList = [
                        'plugins',
                        'publicPath',
                        'alias',
                        'define',
                        'devtool',
                        'externals',
                        'npmType'
                    ];
                    configFileName = 'secywo.ts';
                    break;
                case 'dev':
                    supportedFieldList = ['plugins', 'proxy', 'https', 'devtool'];
                    configFileName = 'secywo.dev.ts';
                    break;
                case 'prod':
                    supportedFieldList = ['plugins', 'console', 'copy', 'devtool'];
                    configFileName = 'secywo.prod.ts';
            }

            const unSupportedField = configFields.find(
                (field) => !supportedFieldList.includes(field)
            );
            if (configFields.length > 0 && unSupportedField) {
                const msgText = `\n The secywo configuration file '${chalk.blue(
                    configFileName
                )}' does not support the field '${chalk.red(unSupportedField)}' `;
                spinner.fail(msgText);
                process.exit();
            }
            //对不支持的npmType值进行提示
            if (
                key === 'base' &&
                !['npm', 'pnpm'].includes(configObj['npmType'] ?? initConfig.npmType)
            ) {
                spinner.fail(
                    `\n The field '${chalk.blue('npmType')}'does not support the value '${chalk.red(configObj['npmType'])}',The value can be 'npm' or 'pnpm' `
                );
                process.exit();
            }

            customConfig[key] = (await import(curConfigFilePath)).default;
        }
    }

    //读取router配置文件
    const routerConfig = (await import(path.resolve(cwd, './config/router.ts'))).default;

    //在开发端项目生成模板路由配置
    await initTemplateRouterConfig(routerConfig, templateType);

    //生成webpack入口文件
    const entryPath = path.resolve(cwd, './src/.secywo/index.js');

    //webpack html template
    const templatePath = path.join(cwd, '/src/index.ejs');

    return {
        projectPath: cwd,
        entryPath,
        templatePath,
        customConfig,
        templateType: templateType ?? 'react'
    };
};

const getFormatRouter = (router = [], templateType) => {
    const _main = (item) => {
        const { path, component, name, children } = item;
        return {
            path,
            component: `()=>import('@/pages/${component}')`,
            name: templateType === 'vue' ? name : undefined,
            routes:
                templateType === 'react' && children
                    ? children?.map((item) => _main(item))
                    : undefined,
            children:
                templateType === 'vue' && children
                    ? children?.map((item) => _main(item))
                    : undefined
        };
    };
    return router.map((item) => {
        return _main(item);
    });
};

//在开发端项目生成模板路由配置
const initTemplateRouterConfig = (routerConfig, templateType) => {
    return new Promise((resolve, reject) => {
        const formatRouter = getFormatRouter(routerConfig, templateType);

        //处理路由配置
        const textData = `
        export default ${JSON.stringify(formatRouter)}

        `;
        let modifiedText = textData.replace(/"(\(\)=>import\('[^']+'\))"/g, '$1');

        //处理后写入开发端项目
        fs.writeFile(
            path.resolve(__dirname, `../template/${templateType}/router.js`),
            modifiedText,
            async (err) => {
                if (err) {
                    const errText = 'An error occurred during the secywo configuration.';
                    spinner.fail(errText);
                    return reject(errText);
                }
                //将编译后的template配置复制到开发端
                await copyDir(
                    path.resolve(__dirname, `../template/${templateType}`),
                    path.resolve(process.cwd(), './src/.secywo')
                );
                resolve(null);
            }
        );
    });
};

//格式化处理开发端的变量定义配置
export const getFormatDefineVars = async (defineVarsConfigData) => {
    const formatObj = {};
    let obj = defineVarsConfigData;
    //支持函数/async函数或返回promise
    if (typeof defineVarsConfigData === 'function') {
        obj = await Promise.resolve(defineVarsConfigData());
    }
    for (const [key, value] of Object.entries(obj)) {
        formatObj[key] = JSON.stringify(value);
    }
    return formatObj;
};

//部分secywo配置项的初始默认值
export const initConfig: CliConfigFields = {
    npmType: 'npm',
    console: true,
    plugins: [],
    publicPath: '/',
    proxy: undefined,
    copy: []
};