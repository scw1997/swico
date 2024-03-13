import portFinder from 'portfinder';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

//复制文件夹
export const copyDirFiles = async (src, dest, filter?: (fileName) => boolean) => {
    const _copy = async (src, dest) => {
        const files = await fs.readdir(src);
        files.forEach((file) => {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            const srcStat = fs.statSync(srcPath);
            if (srcStat.isDirectory()) {
                // 如果是目录，则递归复制
                _copy(srcPath, destPath);
            } else {
                const isFilter = filter ? filter(file) === true : true;
                // 如果是文件，则直接复制
                //是否开启过滤
                if (isFilter) {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        });
        return null; // 所有文件复制完成后调用回调
    };

    try {
        await fs.access(dest);
    } catch (e) {
        // 如果目标文件夹不存在，则创建它
        fs.mkdirSync(dest, { recursive: true });
    }
    await _copy(src, dest);
    return null;
};

//获取随机可用的接口（解决devServer接口占用报错的问题）
export const getPort = () => {
    return portFinder.getPortPromise({
        port: 3000, // minimum port
        stopPort: 3333 //
    });
};

export const toast = {
    error: (message) => {
        console.log(`\n- ${chalk.hex('#5f72f5')('There are some errors about secywo：')} \n`);
        console.log(` > ${chalk.red.bold(message)} \n`);
    },
    warning: (message) => {
        console.log(`\n- ${chalk.hex('#5f72f5')('There are some warnings about secywo：')} \n`);
        console.log(` > ${chalk.hex('#fb8918').bold(message)} \n`);
    }
};
