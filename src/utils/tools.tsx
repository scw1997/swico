import portFinder from 'portfinder';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import * as process from 'process';
import { ConfigRouterType, ConfigRoutesItemType, GlobalData } from './config';

//复制文件夹
export const copyDirFiles = async (src, dest, filter?: (fileName) => boolean) => {
    const _copy = async (src, dest) => {
        const files = await fs.readdir(src);
        //过滤文件
        const filterFiles = files.filter((fileName) => (filter ? filter(fileName) === true : true));
        for await (const file of filterFiles) {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            const srcStat = await fs.stat(srcPath);
            if (srcStat.isDirectory()) {
                // 如果是目录，则递归复制
                _copy(srcPath, destPath);
            } else {
                // 如果是文件，则直接复制
                await fs.copyFile(srcPath, destPath);
            }
        }
        return null; // 所有文件复制完成后调用回调
    };

    try {
        await fs.access(dest);
    } catch (e) {
        // 如果目标文件夹不存在，则创建它
        await fs.mkdir(dest, { recursive: true });
    }
    await _copy(src, dest);
};

//将swico路由配置格式化
export const getFormatRouter = (
    projectPath: string,
    routes: ConfigRouterType['routes'],
    templateType
) => {
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

//获取随机可用的接口（解决devServer接口占用报错的问题）
export const getPort = () => {
    return portFinder.getPortPromise({
        port: 3000, // minimum port
        stopPort: 3333 //
    });
};

export const themeColor = '#7888FCFF';

export const toast = {
    info: (message: string) => {
        console.log(`${chalk.hex(themeColor).bold('swico')} - ${message}\n`);
    },
    success: (message: string) => {
        console.log(`${chalk.hex('#32f264').bold('swico')} - ${message}\n`);
    },
    error: (message: string | string[]) => {
        console.log(`${chalk.red.bold('error')} - There are some errors about Swico： \n`);
        if (Array.isArray(message)) {
            message.forEach((item) => {
                console.log(` > ${chalk.red.bold(item)} \n`);
            });
        } else if (message) {
            console.log(` > ${chalk.red.bold(message)} \n`);
        }
    },
    warning: (message: string | string[]) => {
        console.log(`${chalk.red.bold('#fb8918')} - There are some errors about Swico： \n`);
        if (Array.isArray(message)) {
            message.forEach((item) => {
                console.log(` > ${chalk.hex('#fb8918').bold(item)} \n`);
            });
        } else if (message) {
            console.log(` > ${chalk.hex('#fb8918').bold(message)} \n`);
        }
    }
};

export const initIndexFile = async () => {
    let fileText = await fs.readFile(path.resolve(__dirname, '../index.js'), 'utf8');
    const targetPath = path.resolve(__dirname, '../index.js');

    //还原react hooks的引入路径，由从.secywo引入改为从脚手架引入（避免当不存在.swico文件时的引入错误问题）
    const formatHooksPath = path
        .resolve(process.cwd(), './src/.swico/react-hooks')
        // @ts-ignore
        .replaceAll('\\', '/');

    if (fileText.includes(`require("${formatHooksPath}");`)) {
        fileText = fileText.replaceAll(
            `require("${formatHooksPath}");`,
            'require("./template/react/react-hooks");'
        );

        await fs.writeFile(targetPath, fileText);
    }

    //还原react/vue history的引入路径，由从.secywo引入改为从脚手架引入（避免当不存在.swico文件时的引入错误问题）
    const formatDevHistoryPath = path
        .resolve(process.cwd(), './src/.swico/.dev/history')
        // @ts-ignore
        .replaceAll('\\', '/');

    const formatProdHistoryPath = path
        .resolve(process.cwd(), './src/.swico/.prod/history')
        // @ts-ignore
        .replaceAll('\\', '/');

    if (fileText.includes(`require("${formatDevHistoryPath}");`)) {
        fileText = fileText.replaceAll(
            `require("${formatDevHistoryPath}");`,
            'require("./mock-history");' //这里是个虚拟的history，反正都用不上，只是过渡修改下，避免引用报错
        );

        await fs.writeFile(targetPath, fileText);
    } else if (fileText.includes(`require("${formatProdHistoryPath}");`)) {
        fileText = fileText.replaceAll(
            `require("${formatProdHistoryPath}");`,
            'require("./mock-history");' //这里是个虚拟的history，反正都用不上，只是过渡修改下，避免引用报错
        );

        await fs.writeFile(targetPath, fileText);
    }
};
