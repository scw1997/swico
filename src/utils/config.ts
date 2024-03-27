import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import * as process from 'process';
import { copyDirFiles, toast, writeFile } from './tools';

export type ConfigRoutesItemType = {
    component?: string; //页面路径
    children?: ConfigRoutesItemType[]; //子路由
    path: string; //路由地址
    redirect?: string; // 重定向路由地址
    name?: string;
    auth?: string; //权限组件
    [key: string]: any;
};

export type ConfigRouterType = {
    type?: 'browser' | 'hash'; //路由类型
    base?: string; //路由前缀
    routes?: ConfigRoutesItemType[]; //路由配置
};

export interface GlobalConfigType {
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
    templateType?: GlobalConfigType['template']; //模板类型
    projectPath: string; //模板项目根路径
    entryPath: string; //入口文件路径
    templatePath: string; //html模板文件路径
    env?: 'dev' | 'prod'; //当前调用环境
    customConfig: {
        //脚手架自定义配置
        base: Pick<
            GlobalConfigType,
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
        dev: Pick<GlobalConfigType, 'plugins' | 'proxy' | 'https' | 'devtool' | 'router'>; //开发环境专用
        prod: Pick<GlobalConfigType, 'plugins' | 'console' | 'copy' | 'devtool' | 'router'>; //生产环境专用
    };
}

// 当前命令行选择的目录(即项目根路径)
const projectPath = process.cwd();

//获取开发者的自定义项目配置和相关参数
export const getProjectConfig: (env?: GlobalData['env']) => Promise<GlobalData> = async (env) => {
    //secywo 配置文件路径
    const configDir = path.join(projectPath, '/config');
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
                        'router',
                        'template'
                    ];
                    configFileName = 'secywo.ts';
                    break;
                case 'dev':
                    supportedFieldList = ['plugins', 'proxy', 'https', 'devtool', 'router'];
                    configFileName = 'secywo.dev.ts';
                    break;
                case 'prod':
                    supportedFieldList = ['plugins', 'console', 'copy', 'devtool', 'router'];
                    configFileName = 'secywo.prod.ts';
            }

            const unSupportedField = configFields.find(
                (field) => !supportedFieldList.includes(field)
            );
            if (configFields.length > 0 && unSupportedField) {
                const msgText = `\n The secywo configuration file '${chalk.blue(
                    configFileName
                )}' does not support the field '${chalk.red(unSupportedField)}' `;
                toast.error(msgText);
                process.exit();
            }
            //对不支持的template值进行提示
            if (
                key === 'base' &&
                !['vue', 'react'].includes(configObj['template'] ?? initConfig.template)
            ) {
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
    const templateType = customConfig['base'].template ?? initConfig.template;

    //读取router配置文件
    const routerConfig =
        customConfig[env].router ?? customConfig['base'].router ?? initConfig.router;

    //在开发端项目生成模板路由配置
    await initTemplateRouterConfig(routerConfig, templateType);
    //处理脚手架入口文件
    await handleCliIndexFile(templateType);

    //生成webpack入口文件
    const entryPath = path.resolve(projectPath, './src/.secywo/index.js');

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
        const { path, component, name, children, redirect, auth } = item;

        return auth
            ? {
                  ...item,
                  component: `()=>import('${projectPath}/src/pages/${auth}${templateType === 'vue' ? '.vue' : ''}')`,
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
const handleCliIndexFile = async (templateType: GlobalData['templateType']) => {
    const targetPath = path.resolve(__dirname, '../index.js');
    const targetTypesPath = path.resolve(__dirname, '../index.d.ts');
    let replaceFileText = fs.readFileSync(
        path.resolve(__dirname, `../index.${templateType}.js`),
        'utf8'
    );
    const fileTypesText = fs.readFileSync(
        path.resolve(__dirname, `../index.${templateType}.d.ts`),
        'utf8'
    );

    await writeFile(targetPath, replaceFileText);
    await writeFile(targetTypesPath, fileTypesText);
};

//格式化处理template文件内容
const formatTemplateFileText = (
    { routes = [], type = 'browser', base = '/' }: ConfigRouterType,
    templateType: GlobalData['templateType']
) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        const formatRouter = getFormatRouter(routes, templateType);

        //处理路由配置
        const textData = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ${JSON.stringify(formatRouter)};`;
        let modifiedText = textData.replace(/"(\(\)=>import\('[^']+'\))"/g, '$1');

        await writeFile(
            path.resolve(__dirname, `../template/${templateType}/routes.js`),
            modifiedText
        );

        //读取template/config或者index文件的内容，根据routerType和routerBase的值动态替换里面的部分文本，从而更换路由模式
        const indexFilePath = path.resolve(__dirname, `../template/${templateType}/index.js`);
        const configFilePath = path.resolve(__dirname, `../template/${templateType}/config.js`);
        const indexText = fs.readFileSync(indexFilePath, 'utf8');
        const configText = fs.readFileSync(configFilePath, 'utf8');
        let replaceIndexText = indexText;
        let replaceConfigText = configText;

        if (base) {
            //处理routerBase
            replaceConfigText = replaceConfigText.replace(
                /exports\.routerBase\s*=\s*(.*)/gm,
                function (match, p1) {
                    // p1 是匹配到的 xxx 部分
                    return `exports.routerBase = '${base}';`;
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
        await writeFile(indexFilePath, replaceIndexText);
        await writeFile(configFilePath, replaceConfigText);
        resolve(null);
    });
};

//在开发端项目生成模板路由配置
const initTemplateRouterConfig = (routerConfig, templateType: GlobalData['templateType']) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        await formatTemplateFileText(routerConfig, templateType);

        const copyTargetPath = path.resolve(projectPath, './src/.secywo');
        // 复制的目标目录是否已经存在，强制删除然后重新生成
        if (fs.existsSync(copyTargetPath)) {
            await fs.remove(copyTargetPath);
        }

        //将编译后的template配置复制到开发端
        await copyDirFiles(
            path.resolve(__dirname, `../template/${templateType}`),
            copyTargetPath,
            (fileName) =>
                !fileName.endsWith('.d.ts') &&
                (templateType === 'vue' ? fileName !== 'Container.js' : true)
        );

        //下面是一些复制完之后需要处理的操作
        let replaceIndexText = fs.readFileSync(
            path.resolve(projectPath, './src/.secywo/index.js'),
            'utf8'
        );

        //处理global.less文件
        //先判断开发端是否存在global.less
        try {
            await fs.access(path.resolve(projectPath, './src/global.less'), fs.constants.F_OK);
            //存在则先重置状态，再添加引入
            replaceIndexText = replaceIndexText.replaceAll('require("../global.less");', '');
            replaceIndexText = 'require("../global.less");\n' + replaceIndexText;
        } catch (e) {
            //不存在则取消引入
            replaceIndexText = replaceIndexText.replaceAll('require("../global.less");', '');
        }

        if (templateType === 'vue') {
            replaceIndexText = replaceIndexText.replace('"./Container"', '"./Container.vue"');
            await writeFile(path.resolve(projectPath, './src/.secywo/index.js'), replaceIndexText);
        }

        if (templateType === 'react') {
            //处理React Router 的loading组件
            //先判断开发端是否存在loading组件
            try {
                await fs.access(
                    path.resolve(projectPath, './src/loading/index.tsx'),
                    fs.constants.F_OK
                );
                //存在则将template中引入的loading组件路径替换
                replaceIndexText = replaceIndexText.replace('"./loading"', '"../loading"');
            } catch (e) {
                //不存在也要替换成原值
                replaceIndexText = replaceIndexText.replace('"../loading"', '"./loading"');
            } finally {
                await writeFile(
                    path.resolve(projectPath, './src/.secywo/index.js'),
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

//部分secywo配置项的初始默认值
export const initConfig: GlobalConfigType = {
    template: 'react',
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
