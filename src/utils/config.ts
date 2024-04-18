import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { copyDirFiles, toast } from './tools';

export type ConfigRoutesItemType = {
    component?: string; //页面路径
    children?: ConfigRoutesItemType[]; //子路由
    path: string; //路由地址
    redirect?: string; // 重定向路由地址
    name?: string;
    decorator?: string; //装饰组件
    [key: string]: any;
};

export type ConfigRouterType = {
    type?: 'browser' | 'hash'; //路由类型
    base?: string; //路由前缀
    routes?: ConfigRoutesItemType[]; //路由配置
};

//swico所有可配置选项
export interface GlobalSwicoConfigType {
    template: 'react' | 'vue'; //模板类型
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
    router?: ConfigRouterType; //路由相关
}

export interface GlobalData {
    templateType?: GlobalSwicoConfigType['template']; //模板类型
    projectPath: string; //模板项目根路径
    entryPath: string; //入口文件路径
    templatePath: string; //html模板文件路径
    env?: 'dev' | 'prod'; //当前调用环境
    customConfig: {
        //脚手架自定义配置
        base: Pick<
            GlobalSwicoConfigType,
            | 'plugins'
            | 'publicPath'
            | 'alias'
            | 'define'
            | 'devtool'
            | 'externals'
            | 'npmType'
            | 'router'
            | 'template'
        >; //公共通用
        dev: Pick<GlobalSwicoConfigType, 'plugins' | 'proxy' | 'https' | 'devtool' | 'router'>; //开发环境专用
        prod: Pick<GlobalSwicoConfigType, 'plugins' | 'console' | 'copy' | 'devtool' | 'router'>; //生产环境专用
    };
}

// 当前命令行选择的目录(即项目根路径)
const projectPath = process.cwd();

//获取开发者的自定义项目配置和相关参数
export const getProjectConfig: (env: GlobalData['env']) => Promise<GlobalData> = async (env) => {
    //swico 配置文件路径
    const configDir = path.join(projectPath, '/config');
    // 脚手架对应的配置文件信息
    const configPath = {
        dev: path.join(configDir, '/swico.dev.ts'),
        prod: path.join(configDir, '/swico.prod.ts'),
        base: path.join(configDir, '/swico.ts')
    };

    const customConfig = {} as GlobalData['customConfig'];
    //读取各环境配置文件并写入

    for (const key of Object.keys(configPath)) {
        const curConfigFilePath = configPath[key];
        const exists = await fs.exists(curConfigFilePath);
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
                        'router',
                        'template'
                    ];
                    configFileName = 'swico.ts';
                    break;
                case 'dev':
                    supportedFieldList = ['plugins', 'proxy', 'https', 'devtool', 'router'];
                    configFileName = 'swico.dev.ts';
                    break;
                case 'prod':
                    supportedFieldList = ['plugins', 'console', 'copy', 'devtool', 'router'];
                    configFileName = 'swico.prod.ts';
            }

            const unSupportedField = configFields.find(
                (field) => !supportedFieldList.includes(field)
            );
            if (configFields.length > 0 && unSupportedField) {
                const msgText = `\n The Swico configuration file '${chalk.blue(
                    configFileName
                )}' does not support the field '${chalk.red(unSupportedField)}' `;
                toast.error(msgText);
                process.exit();
            }
            //对不支持的template值进行提示
            if (key === 'base' && !['vue', 'react'].includes(configObj['template'])) {
                toast.error(
                    `The field '${chalk.blue('template')}' does not support the value '${chalk.red(configObj['template'])}',the value can be 'vue' or 'react' `
                );
                process.exit();
            }
            //对不支持的npmType值进行提示
            if (
                key === 'base' &&
                !['npm', 'pnpm'].includes(configObj['npmType'] ?? initConfig.npmType)
            ) {
                toast.error(
                    `The field '${chalk.blue('npmType')}' does not support the value '${chalk.red(configObj['npmType'])}',the value can be 'npm' or 'pnpm' `
                );
                process.exit();
            }
            //对不支持的routerType值进行提示
            if (
                !['hash', 'browser'].includes(configObj['router']?.type ?? initConfig.router.type)
            ) {
                toast.error(
                    `The field '${chalk.blue('router.type')}' does not support the value '${chalk.red(configObj['router'].type)}',the value can be 'browser' or 'hash' `
                );
                process.exit();
            }

            customConfig[key] = (await import(curConfigFilePath)).default;
        }
    }
    const templateType = customConfig['base'].template;

    //读取router配置文件
    const routerConfig = {
        ...initConfig.router,
        ...customConfig['base'].router,
        ...customConfig[env].router
    };

    //在开发端项目生成.secywo配置文件
    await initTemplateConfig(routerConfig, templateType, env);
    //处理脚手架入口文件
    await initCliIndexFile(templateType);

    const envPath = env === 'dev' ? '.dev/' : '.prod/';

    //生成webpack入口文件
    const entryPath = path.resolve(projectPath, `./src/.swico/${envPath}index.js`);

    //webpack html template
    const templatePath = path.join(projectPath, '/src/index.ejs');

    return {
        projectPath,
        entryPath,
        templatePath,
        customConfig,
        templateType
    };
};

const getFormatRouter = (routes: ConfigRouterType['routes'], templateType) => {
    const _main = (item: ConfigRoutesItemType) => {
        const { path, component, name, children, redirect, decorator } = item;

        return decorator
            ? {
                  ...item,
                  component: `()=>import('${projectPath}/src/pages/${decorator}${templateType === 'vue' ? '.vue' : ''}')`,
                  children: [
                      {
                          path: '',
                          component: component
                              ? `()=>import('${projectPath}/src/pages/${component}${templateType === 'vue' ? '.vue' : ''}')`
                              : undefined,
                          name,
                          redirect,
                          children: children ? children?.map((item) => _main(item)) : undefined
                      }
                  ]
              }
            : {
                  path,
                  component: component
                      ? `()=>import('${projectPath}/src/pages/${component}${templateType === 'vue' ? '.vue' : ''}')`
                      : undefined,
                  name,
                  redirect,
                  children: children ? children?.map((item) => _main(item)) : undefined
              };
    };
    return routes.map((item) => {
        return _main(item);
    });
};

//根据template处理脚手架入口文件,暴露必要的api
const initCliIndexFile = async (templateType: GlobalData['templateType']) => {
    const targetPath = path.resolve(__dirname, '../index.js');
    const targetTypesPath = path.resolve(__dirname, '../index.d.ts');
    let replaceFileText = await fs.readFile(
        path.resolve(__dirname, `../index.${templateType}.js`),
        'utf8'
    );
    const fileTypesText = await fs.readFile(
        path.resolve(__dirname, `../index.${templateType}.d.ts`),
        'utf8'
    );
    if (templateType === 'react') {
        //处理react hooks的引入路径，由从脚手架引入改为从.secywo引入
        const formatHooksPath = path
            .resolve(projectPath, './src/.swico/react-hooks')
            // @ts-ignore
            .replaceAll('\\', '/');
        replaceFileText = replaceFileText.replaceAll(
            'require("./template/react/react-hooks");',
            `require("${formatHooksPath}");`
        );
    }

    await fs.writeFile(targetPath, replaceFileText);
    await fs.writeFile(targetTypesPath, fileTypesText);
};

//路由相关配置
const formatRouterConfig = (
    { routes = [], type = 'browser', base = '/' }: ConfigRouterType,
    templateType: GlobalData['templateType'],
    env: GlobalData['env']
) => {
    const envPath = env === 'dev' ? '/.dev/' : '/.prod/';

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        //处理路由配置

        const formatRouter = getFormatRouter(routes, templateType);

        const textData = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default  = ${JSON.stringify(formatRouter)};`;
        let modifiedText = textData.replace(/"(\(\)=>import\('[^']+'\))"/g, '$1');

        await fs.writeFile(
            path.resolve(projectPath, `./src/.swico${envPath}routes.js`),
            modifiedText
        );

        //读取template/config文件的内容，根据routerType和routerBase的值动态替换里面的部分文本，从而更换路由模式
        const configFilePath = path.resolve(projectPath, `./src/.swico${envPath}config.js`);
        let replaceConfigText = await fs.readFile(configFilePath, 'utf8');

        if (base) {
            //处理routerBase
            replaceConfigText = replaceConfigText.replace(
                /exports\.routerBase\s*=\s*(.*)/gm,
                function (match, p1) {
                    // p1 是匹配到的 xxx 部分
                    //对react模板的hash路由进行特殊处理，忽略base值
                    return `exports.routerBase = '${templateType === 'react' && type === 'hash' ? '/' : base}';`;
                }
            );
        }
        if (type) {
            //处理routerType
            replaceConfigText = replaceConfigText.replace(
                /exports\.routerType\s*=\s*(.*)/gm,
                function (match, p1) {
                    // p1 是匹配到的 xxx 部分
                    return `exports.routerType = '${type}';`;
                }
            );
        }

        //最后写入修改后的内容
        await fs.writeFile(configFilePath, replaceConfigText);
        resolve(null);
    });
};

//在开发端项目生成模板路由配置
const initTemplateConfig = (
    routerConfig,
    templateType: GlobalData['templateType'],
    env: GlobalData['env']
) => {
    const envPath = env === 'dev' ? '/.dev/' : '/.prod/';
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        const copyTargetPath = path.resolve(projectPath, `./src/.swico${envPath}`);

        //将template路径中跟环境相关的文件复制到开发端相应env路径
        await copyDirFiles(
            path.resolve(__dirname, `../template/${templateType}/$env`),
            copyTargetPath,
            (fileName) =>
                !fileName.endsWith('.d.ts') &&
                (templateType === 'vue'
                    ? !['Container.js', 'vue-hooks.js'].includes(fileName)
                    : !['react-hooks.js'].includes(fileName))
        );

        //将template路径中跟环境无关的配置文件复制到开发端固定路径
        await copyDirFiles(
            path.resolve(__dirname, `../template/${templateType}`),
            path.resolve(projectPath, './src/.swico'),
            (fileName) =>
                ['react-hooks.js', 'vue-hooks.js', 'loading.js', 'Container.vue'].includes(fileName)
        );

        //下面是一些复制完之后需要修改的操作

        //处理路由相关
        await formatRouterConfig(routerConfig, templateType, env);

        //处理index.js的引入相关
        let replaceIndexText = await fs.readFile(
            path.resolve(projectPath, `./src/.swico${envPath}index.js`),
            'utf8'
        );

        //处理hooks.js的引入相关
        const hooksFilePath = path.resolve(projectPath, `./src/.swico/${templateType}-hooks.js`);
        let replaceHooksText = await fs.readFile(hooksFilePath, 'utf8');
        replaceHooksText = replaceHooksText.replaceAll('$env', `.${env}`);
        await fs.writeFile(hooksFilePath, replaceHooksText);

        //处理global.less文件
        //先判断开发端是否存在global.less
        try {
            await fs.access(path.resolve(projectPath, './src/global.less'), fs.constants.F_OK);
            //存在则先重置状态，再添加引入
            replaceIndexText = replaceIndexText.replaceAll('require("../../global.less");', '');
            replaceIndexText = 'require("../../global.less");\n' + replaceIndexText;
        } catch (e) {
            //不存在则取消引入
            replaceIndexText = replaceIndexText.replaceAll('require("../../global.less");', '');
        }

        //处理Container组件，将ts换成vue（因为vue文件默认包内不支持引入）
        if (templateType === 'vue') {
            replaceIndexText = replaceIndexText.replace('"../Container"', '"../Container.vue"');
            await fs.writeFile(
                path.resolve(projectPath, `./src/.swico${envPath}index.js`),
                replaceIndexText
            );
        } else if (templateType === 'react') {
            //处理React Router 的loading组件
            //先判断开发端是否存在loading组件
            try {
                await fs.access(
                    path.resolve(projectPath, './src/loading/index.tsx'),
                    fs.constants.F_OK
                );
                //存在则将template中引入的loading组件路径替换
                replaceIndexText = replaceIndexText.replace('"../loading"', '"../../loading"');
            } catch (e) {
                //不存在也要替换成原值
                replaceIndexText = replaceIndexText.replace('"../../loading"', '"../loading"');
            } finally {
                //更新index.js
                await fs.writeFile(
                    path.resolve(projectPath, `./src/.swico${envPath}index.js`),
                    replaceIndexText
                );
            }
        }
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

//部分swico配置项的初始默认值
export const initConfig: Omit<GlobalSwicoConfigType, 'template'> = {
    npmType: 'npm',
    console: true,
    plugins: [],
    publicPath: '/',
    proxy: undefined,
    copy: [],
    router: {
        base: '/',
        type: 'browser',
        routes: []
    }
};
