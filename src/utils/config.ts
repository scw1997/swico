import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import * as process from 'process';
import { copyDir } from './tools';
const spinner = ora();

export type RoutePageType = {
    component?: string;
    children?: RoutePageType[];
    path: string;
};

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
    routes?: RoutePageType[]; //路由配置
    routerType?: 'browser' | 'hash'; //路由类型
    routerBase?: string; //路由前缀
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
            | 'plugins'
            | 'publicPath'
            | 'alias'
            | 'define'
            | 'devtool'
            | 'externals'
            | 'npmType'
            | 'routes'
            | 'routerType'
            | 'routerBase'
        >; //公共通用
        dev: Pick<
            CliConfigFields,
            'plugins' | 'proxy' | 'https' | 'devtool' | 'routes' | 'routerType' | 'routerBase'
        >; //开发环境专用
        prod: Pick<
            CliConfigFields,
            'plugins' | 'console' | 'copy' | 'devtool' | 'routes' | 'routerType' | 'routerBase'
        >; //生产环境专用
    };
}

//获取开发者的自定义项目配置和相关参数
export const getProjectConfig: (
    templateType?: 'vue' | 'react',
    env?: GlobalData['env']
) => Promise<GlobalData> = async (templateType, env) => {
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
                        'npmType',
                        'routes',
                        'routerType',
                        'routerBase'
                    ];
                    configFileName = 'secywo.ts';
                    break;
                case 'dev':
                    supportedFieldList = [
                        'plugins',
                        'proxy',
                        'https',
                        'devtool',
                        'routes',
                        'routerType',
                        'routerBase'
                    ];
                    configFileName = 'secywo.dev.ts';
                    break;
                case 'prod':
                    supportedFieldList = [
                        'plugins',
                        'console',
                        'copy',
                        'devtool',
                        'routes',
                        'routerType',
                        'routerBase'
                    ];
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
                    `The field '${chalk.blue('npmType')}'does not support the value '${chalk.red(configObj['npmType'])}',The value can be 'npm' or 'pnpm' `
                );
                process.exit();
            }
            //对不支持的routerType值进行提示
            if (!['hash', 'browser'].includes(configObj['routerType'] ?? initConfig.routerType)) {
                spinner.fail(
                    `The field '${chalk.blue('routerType')}'does not support the value '${chalk.red(configObj['routerType'])}',The value can be 'browser' or 'hash' `
                );
                process.exit();
            }

            customConfig[key] = (await import(curConfigFilePath)).default;
        }
    }

    //读取router配置文件
    const routerConfig =
        customConfig[env].routes ?? customConfig['base'].routes ?? initConfig.routes;

    const routerType =
        customConfig[env].routerType ?? customConfig['base'].routerType ?? initConfig.routerType;

    const routerBase =
        customConfig[env].routerBase ?? customConfig['base'].routerBase ?? initConfig.routerBase;

    //在开发端项目生成模板路由配置
    await initTemplateRouterConfig(
        { routes: routerConfig, type: routerType, base: routerBase },
        templateType
    );

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

const getFormatRouter = (routes = [], templateType) => {
    const _main = (item) => {
        const { path, component, name, children } = item;
        return {
            path,
            component: `()=>import('@/${templateType === 'vue' ? 'views' : 'pages'}/${component}')`,
            name: templateType === 'vue' ? name : undefined,
            children: children ? children?.map((item) => _main(item)) : undefined
        };
    };
    return routes.map((item) => {
        return _main(item);
    });
};

//格式化处理template文件内容
const formatTemplateFileText = ({ routes, type, base }, templateType) => {
    return new Promise((resolve, reject) => {
        const formatRouter = getFormatRouter(routes, templateType);

        //处理路由配置
        const textData = `export default ${JSON.stringify(formatRouter)}`;
        let modifiedText = textData.replace(/"(\(\)=>import\('[^']+'\))"/g, '$1');

        //处理后写入开发端项目
        fs.writeFile(
            path.resolve(__dirname, `../template/${templateType}/routes.js`),
            modifiedText,
            async (err) => {
                if (err) {
                    const errText = 'An error occurred during the secywo configuration.';
                    spinner.fail(errText);
                    return reject(errText);
                }
                //读取index文件的内容，根据routerType的值动态替换里面的部分文本，从而更换路由模式
                const indexText = fs.readFileSync(
                    path.resolve(__dirname, `../template/${templateType}/index.js`),
                    'utf8'
                );
                let replaceIndexText = indexText;
                switch (true) {
                    case templateType === 'vue' && type === 'hash':
                        replaceIndexText = indexText.replaceAll(
                            'createWebHistory',
                            'createWebHashHistory'
                        );
                        if (base) {
                            //处理routerBase
                            replaceIndexText = replaceIndexText.replace(
                                /createWebHashHistory\)\('([^']*)'\)/g,
                                function (match, p1) {
                                    return `createWebHashHistory)('${base}')`; // 返回替换后的字符串
                                }
                            );
                        }
                        break;
                    case templateType === 'vue' && type === 'browser':
                        replaceIndexText = indexText.replaceAll(
                            'createWebHashHistory',
                            'createWebHistory'
                        );
                        if (base) {
                            //处理routerBase
                            replaceIndexText = replaceIndexText.replace(
                                /createWebHistory\)\('([^']*)'\)/g,
                                function (match, p1) {
                                    // p1 是匹配到的 xxx 部分
                                    return `createWebHistory)('${base}')`; // 返回替换后的字符串
                                }
                            );
                        }
                        break;
                    case templateType === 'react' && type === 'hash':
                        replaceIndexText = indexText.replaceAll('BrowserRouter', 'HashRouter');

                        break;
                    case templateType === 'react' && type === 'browser':
                        replaceIndexText = indexText.replaceAll('HashRouter', 'BrowserRouter');
                        break;
                }
                if (templateType === 'react') {
                    if (base) {
                        //处理routerBase
                        replaceIndexText = replaceIndexText.replace(
                            /exports.basename = '([^']*)';/g,
                            function (match, p1) {
                                // p1 是匹配到的 xxx 部分
                                return `exports.basename = '${base}';`;
                            }
                        );
                    }
                    //处理React Router 的loading组件
                    //先判断开发端是否存在loading组件
                    try {
                        await fs.access(
                            path.resolve(process.cwd(), './src/loading/index.tsx'),
                            fs.constants.F_OK
                        );
                        //存在则将template中引入的loading组件路径替换
                        replaceIndexText = replaceIndexText.replace('./loading', '../loading');
                    } catch (e) {
                        //不存在
                    }
                }

                fs.writeFile(
                    path.resolve(__dirname, `../template/${templateType}/index.js`),
                    replaceIndexText,
                    () => {
                        if (err) {
                            const errText = 'An error occurred during the secywo configuration.';
                            spinner.fail(errText);
                            return reject(errText);
                        }
                        resolve(null);
                    }
                );
            }
        );
    });
};

//在开发端项目生成模板路由配置
const initTemplateRouterConfig = (routerConfig, templateType) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        await formatTemplateFileText(routerConfig, templateType);

        const copyTargetPath = path.resolve(process.cwd(), './src/.secywo');
        // 复制的目标目录是否已经存在，强制删除然后重新生成
        if (fs.existsSync(copyTargetPath)) {
            await fs.remove(copyTargetPath);
        }

        //将编译后的template配置复制到开发端
        await copyDir(
            path.resolve(__dirname, `../template/${templateType}`),
            copyTargetPath,
            (fileNane) => !fileNane.endsWith('.d.ts')
        );
        resolve(null);
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
    copy: [],
    routes: [],
    routerType: 'browser',
    routerBase: '/'
};
