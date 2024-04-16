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
    info: (message: string) => {
        console.log(`\n> ${chalk.hex('#5f72f5')(message)}\n`);
    },
    error: (message: string | string[]) => {
        console.log(`\n> ${chalk.hex('#5f72f5')('There are some errors about Swico：')} \n`);
        if (Array.isArray(message)) {
            message.forEach((item) => {
                console.log(` > ${chalk.red.bold(item)} \n`);
            });
        } else {
            console.log(` > ${chalk.red.bold(message)} \n`);
        }
    },
    warning: (message: string | string[]) => {
        console.log(`\n> ${chalk.hex('#5f72f5')('There are some warnings about Swico：')} \n`);
        if (Array.isArray(message)) {
            message.forEach((item) => {
                console.log(` > ${chalk.hex('#fb8918').bold(item)} \n`);
            });
        } else {
            console.log(` > ${chalk.hex('#fb8918').bold(message)} \n`);
        }
    }
};

//写入文件
export const writeFile = (sourcePath, text) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(sourcePath, text, (err) => {
            if (err) {
                const errText = 'An error occurred during the Swico configuration.';
                toast.error(errText);
                return reject(errText);
            } else {
                return resolve(null);
            }
        });
    });
};

export const initIndexFile = async (tempalteType) => {
    //还原脚手架index.js的内容
    if (tempalteType === 'react') {
        const fileText = fs.readFileSync(path.resolve(__dirname, '../index.react.js'), 'utf8');
        const targetPath = path.resolve(__dirname, '../index.js');

        await writeFile(targetPath, fileText);
    }
};
